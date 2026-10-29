import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Collection } from './entities/collection.entity.js';
import { CreateCollectionDto } from './dto/create-collection.dto.js';
import { UpdateCollectionDto } from './dto/update-collection.dto.js';
import { ReorderCollectionsDto } from './dto/reorder-collections.dto.js';
import { Publication } from '../../modules/publication/entities/publication.entity.js';
import { AssetCollection } from '../asset-collection/entities/asset-collection.entity.js';

const collectionRelations = {
  publication: { meta: { client: true } },
} as const;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === '23505';
}

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  private async nextPosition(publicationId: number): Promise<number> {
    const last = await this.collectionRepository.maximum('position', {
      publication: { id: publicationId },
    });

    return (last ?? 0) + 1;
  }

  // Positions stay 1..n; safe inside a transaction because the unique constraint is deferred.
  private async renumber(manager: EntityManager, publicationId: number): Promise<void> {
    const collections = await manager.find(Collection, {
      where: { publication: { id: publicationId } },
      order: { position: 'ASC' },
    });

    for (const [index, collection] of collections.entries()) {
      if (collection.position !== index + 1) {
        await manager.update(Collection, collection.id, { position: index + 1 });
      }
    }
  }

  async create(
    createCollectionDto: CreateCollectionDto,
  ): Promise<Collection> {
    const { publicationId, type } = createCollectionDto;

    const publication = await this.publicationRepository.findOneBy({
      id: publicationId,
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publicationId} not found`,
      );
    }

    const collection = this.collectionRepository.create({
      type,
      publication,
      position: await this.nextPosition(publicationId),
    });

    try {
      return await this.collectionRepository.save(collection);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `Another collection took the next position in Publication ${publicationId}; try again`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<Collection[]> {
    return this.collectionRepository.find({
      relations: collectionRelations,
      order: { publication: { id: 'ASC' }, position: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: collectionRelations,
    });

    if (!collection) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }

    return collection;
  }

  async update(
    id: number,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: { publication: true },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }

    if (Object.keys(updateCollectionDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateCollectionDto.type !== undefined) {
      collection.type = updateCollectionDto.type;
    }

    let previousPublicationId: number | null = null;

    if (
      updateCollectionDto.publicationId !== undefined &&
      updateCollectionDto.publicationId !== collection.publication.id
    ) {
      const publication = await this.publicationRepository.findOneBy({
        id: updateCollectionDto.publicationId,
      });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${updateCollectionDto.publicationId} not found`,
        );
      }

      previousPublicationId = collection.publication.id;
      collection.publication = publication;
      collection.position = await this.nextPosition(publication.id);
    }

    try {
      return await this.collectionRepository.manager.transaction(async (manager) => {
        const saved = await manager.save(Collection, collection);

        if (previousPublicationId !== null) {
          await this.renumber(manager, previousPublicationId);
        }

        return saved;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Another collection took that position in the publication; try again',
        );
      }

      throw error;
    }
  }

  async reorder(reorderDto: ReorderCollectionsDto): Promise<Collection[]> {
    const { publicationId, ids } = reorderDto;

    const publication = await this.publicationRepository.findOneBy({
      id: publicationId,
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publicationId} not found`,
      );
    }

    const current = await this.collectionRepository.find({
      where: { publication: { id: publicationId } },
    });
    const currentIds = new Set(current.map((collection) => collection.id));

    if (ids.length !== currentIds.size || ids.some((id) => !currentIds.has(id))) {
      throw new BadRequestException(
        `ids must list every collection of Publication ${publicationId} exactly once`,
      );
    }

    await this.collectionRepository.manager.transaction(async (manager) => {
      for (const [index, id] of ids.entries()) {
        await manager.update(Collection, id, { position: index + 1 });
      }
    });

    return this.collectionRepository.find({
      where: { publication: { id: publicationId } },
      relations: collectionRelations,
      order: { position: 'ASC' },
    });
  }

  async remove(id: number): Promise<void> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: { publication: true },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }

    await this.collectionRepository.manager.transaction(async (manager) => {
      // Only the associations go; the assets stay in the global inventory.
      await manager
        .createQueryBuilder()
        .delete()
        .from(AssetCollection)
        .where('collection_id = :id', { id })
        .execute();
      await manager.delete(Collection, id);
      await this.renumber(manager, collection.publication.id);
    });
  }
}