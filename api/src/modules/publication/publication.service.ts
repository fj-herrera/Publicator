import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from './entities/publication.entity.js';
import { CreatePublicationDto } from './dto/create-publication.dto.js';
import { UpdatePublicationDto } from './dto/update-publication.dto.js';
import { Type } from '../../modules/type/entities/type.entity.js';
import { Meta } from '../../modules/meta/entities/meta.entity.js';
import { Content } from '../content/entities/content.entity.js';
import { TextContent } from '../text-content/entities/text-content.entity.js';
import { Collection } from '../collection/entities/collection.entity.js';
import { AssetCollection } from '../asset-collection/entities/asset-collection.entity.js';
import { PublicationAsset } from '../publication-asset/entities/publication-asset.entity.js';
import { PublicationContext } from '../publication-context/entities/publication-context.entity.js';
import { PublicationSkillGroup } from '../publication-skill-group/entities/publication-skill-group.entity.js';
import { PublicationTag } from '../publication-tag/entities/publication-tag.entity.js';

@Injectable()
export class PublicationService {
  constructor(
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,

    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,

    @InjectRepository(Meta)
    private readonly metaRepository: Repository<Meta>,
  ) {}

  async create(
    createPublicationDto: CreatePublicationDto,
  ): Promise<Publication> {
    try {
      const { typeId, metaId } = createPublicationDto;

      const type = await this.typeRepository.findOneBy({ id: typeId });

      if (!type) {
        throw new NotFoundException(`Type with id ${typeId} not found`);
      }

      const meta = await this.metaRepository.findOneBy({ id: metaId });

      if (!meta) {
        throw new NotFoundException(`Meta with id ${metaId} not found`);
      }

      const publication = this.publicationRepository.create({
        type,
        meta,
      });

      return await this.publicationRepository.save(publication);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Meta with id ${createPublicationDto.metaId} is already associated with a publication`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<Publication[]> {
    return this.publicationRepository.find({
      relations: {
        type: true,
        meta: true,
      },
    });
  }

  async findOne(id: number): Promise<Publication> {
    const publication = await this.publicationRepository.findOne({
      where: { id },
      relations: {
        type: true,
        meta: true,
      },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with id ${id} not found`);
    }

    return publication;
  }

  async update(
    id: number,
    updatePublicationDto: UpdatePublicationDto,
  ): Promise<Publication> {
    const publication = await this.publicationRepository.findOneBy({ id });

    if (!publication) {
      throw new NotFoundException(`Publication with id ${id} not found`);
    }

    if (Object.keys(updatePublicationDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }
    const { typeId, metaId } = updatePublicationDto;

    if (typeId !== undefined) {
      const type = await this.typeRepository.findOneBy({ id: typeId });

      if (!type) {
        throw new NotFoundException(`Type with id ${typeId} not found`);
      }

      publication.type = type;
    }

    if (metaId !== undefined) {
      const meta = await this.metaRepository.findOneBy({ id: metaId });

      if (!meta) {
        throw new NotFoundException(`Meta with id ${metaId} not found`);
      }

      publication.meta = meta;
    }

    try {
      return await this.publicationRepository.save(publication);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Meta with id ${metaId} is already associated with a publication`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.publicationRepository.manager.transaction(async (manager) => {
      const publication = await manager.findOne(Publication, {
        where: { id },
        relations: { meta: true },
      });

      if (!publication) {
        throw new NotFoundException(`Publication with id ${id} not found`);
      }

      // Ids are resolved first: TypeORM rewrites property names such as
      // `content` inside raw subqueries and breaks the SQL.
      const [contents, collections] = await Promise.all([
        manager.find(Content, { where: { publication: { id } }, select: { id: true } }),
        manager.find(Collection, { where: { publication: { id } }, select: { id: true } }),
      ]);
      const contentIds = contents.map((item) => item.id);
      const collectionIds = collections.map((item) => item.id);

      // Children first so every foreign key is satisfied; shared resources
      // (assets, texts, tags, contexts, skill groups...) are never touched.
      const dependents: [new () => object, string, Record<string, unknown>, boolean][] = [
        [TextContent, 'content_id IN (:...ids)', { ids: contentIds }, contentIds.length > 0],
        [Content, 'publication_id = :id', { id }, true],
        [AssetCollection, 'collection_id IN (:...ids)', { ids: collectionIds }, collectionIds.length > 0],
        [Collection, 'publication_id = :id', { id }, true],
        [PublicationAsset, 'publication_id = :id', { id }, true],
        [PublicationContext, 'publication_id = :id', { id }, true],
        [PublicationSkillGroup, 'publication_id = :id', { id }, true],
        [PublicationTag, 'publication_id = :id', { id }, true],
      ];

      for (const [entity, condition, params, shouldRun] of dependents) {
        if (!shouldRun) continue;
        await manager
          .createQueryBuilder()
          .delete()
          .from(entity)
          .where(condition, params)
          .execute();
      }

      await manager.delete(Publication, id);
      // Meta is one-to-one with its publication, so it goes with it.
      await manager.delete(Meta, publication.meta.id);
    });
  }
}