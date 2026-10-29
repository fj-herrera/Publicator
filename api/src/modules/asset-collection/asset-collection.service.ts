import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AssetCollection } from './entities/asset-collection.entity.js';
import { ReorderAssetCollectionsDto } from './dto/reorder-asset-collections.dto.js';
import { CreateAssetCollectionDto } from './dto/create-asset-collection.dto.js';
import { UpdateAssetCollectionDto } from './dto/update-asset-collection.dto.js';
import { Collection } from '../../modules/collection/entities/collection.entity.js';
import { Asset } from '../../modules/asset/entities/asset.entity.js';

@Injectable()
export class AssetCollectionService {
  constructor(
    @InjectRepository(AssetCollection)
    private readonly assetCollectionRepository: Repository<AssetCollection>,

    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,

    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  private async nextPosition(collectionId: number): Promise<number> {
    const last = await this.assetCollectionRepository.maximum('position', {
      collection: { id: collectionId },
    });

    return (last ?? 0) + 1;
  }

  // Positions stay 1..n; safe inside a transaction because the unique constraint is deferred.
  private async renumber(manager: EntityManager, collectionId: number): Promise<void> {
    const items = await manager.find(AssetCollection, {
      where: { collection: { id: collectionId } },
      order: { position: 'ASC' },
    });

    for (const [index, item] of items.entries()) {
      if (item.position !== index + 1) {
        await manager.update(AssetCollection, item.id, { position: index + 1 });
      }
    }
  }

  async create(
    createAssetCollectionDto: CreateAssetCollectionDto,
  ): Promise<AssetCollection> {
    const {
      collectionId,
      assetId,
      role,
    } = createAssetCollectionDto;

    const collection = await this.collectionRepository.findOneBy({
      id: collectionId,
    });

    if (!collection) {
      throw new NotFoundException(
        `Collection with id ${collectionId} not found`,
      );
    }

    const asset = await this.assetRepository.findOneBy({
      id: assetId,
    });

    if (!asset) {
      throw new NotFoundException(
        `Asset with id ${assetId} not found`,
      );
    }

    const position = await this.nextPosition(collectionId);

    try {
      const assetCollection =
        this.assetCollectionRepository.create({
          role,
          position,
          collection,
          asset,
        });

      return await this.assetCollectionRepository.save(
        assetCollection,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Asset ${assetId} with role "${role}" is already associated with Collection ${collectionId}`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<AssetCollection[]> {
    return this.assetCollectionRepository.find({
      relations: {
        collection: true,
        asset: { dimensions: true },
      },
      order: { collection: { id: 'ASC' }, position: 'ASC' },
    });
  }

  async findOne(id: number): Promise<AssetCollection> {
    const assetCollection =
      await this.assetCollectionRepository.findOne({
        where: { id },
        relations: {
          collection: true,
          asset: { dimensions: true },
        },
      });

    if (!assetCollection) {
      throw new NotFoundException(
        `AssetCollection with id ${id} not found`,
      );
    }

    return assetCollection;
  }

  async update(
    id: number,
    updateAssetCollectionDto: UpdateAssetCollectionDto,
  ): Promise<AssetCollection> {
    const assetCollection =
      await this.assetCollectionRepository.findOne({
        where: { id },
        relations: { collection: true },
      });

    if (!assetCollection) {
      throw new NotFoundException(
        `AssetCollection with id ${id} not found`,
      );
    }

    if (Object.keys(updateAssetCollectionDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateAssetCollectionDto.role !== undefined) {
      assetCollection.role = updateAssetCollectionDto.role;
    }

    let previousCollectionId: number | null = null;

    if (
      updateAssetCollectionDto.collectionId !== undefined &&
      updateAssetCollectionDto.collectionId !== assetCollection.collection.id
    ) {
      const collection =
        await this.collectionRepository.findOneBy({
          id: updateAssetCollectionDto.collectionId,
        });

      if (!collection) {
        throw new NotFoundException(
          `Collection with id ${updateAssetCollectionDto.collectionId} not found`,
        );
      }

      previousCollectionId = assetCollection.collection.id;
      assetCollection.collection = collection;
      assetCollection.position = await this.nextPosition(collection.id);
    }

    if (updateAssetCollectionDto.assetId !== undefined) {
      const asset = await this.assetRepository.findOneBy({
        id: updateAssetCollectionDto.assetId,
      });

      if (!asset) {
        throw new NotFoundException(
          `Asset with id ${updateAssetCollectionDto.assetId} not found`,
        );
      }

      assetCollection.asset = asset;
    }

    try {
      return await this.assetCollectionRepository.manager.transaction(async (manager) => {
        const saved = await manager.save(AssetCollection, assetCollection);

        if (previousCollectionId !== null) {
          await this.renumber(manager, previousCollectionId);
        }

        return saved;
      });
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'This Asset is already associated with this Collection using this role',
        );
      }

      throw error;
    }
  }

  async reorder(
    reorderDto: ReorderAssetCollectionsDto,
  ): Promise<AssetCollection[]> {
    const { collectionId, ids } = reorderDto;

    const collection = await this.collectionRepository.findOneBy({
      id: collectionId,
    });

    if (!collection) {
      throw new NotFoundException(
        `Collection with id ${collectionId} not found`,
      );
    }

    const current = await this.assetCollectionRepository.find({
      where: { collection: { id: collectionId } },
    });
    const currentIds = new Set(current.map((item) => item.id));

    if (ids.length !== currentIds.size || ids.some((id) => !currentIds.has(id))) {
      throw new BadRequestException(
        `ids must list every asset association of Collection ${collectionId} exactly once`,
      );
    }

    await this.assetCollectionRepository.manager.transaction(async (manager) => {
      for (const [index, id] of ids.entries()) {
        await manager.update(AssetCollection, id, { position: index + 1 });
      }
    });

    return this.assetCollectionRepository.find({
      where: { collection: { id: collectionId } },
      relations: { collection: true, asset: { dimensions: true } },
      order: { position: 'ASC' },
    });
  }

  async remove(id: number): Promise<void> {
    const assetCollection = await this.assetCollectionRepository.findOne({
      where: { id },
      relations: { collection: true },
    });

    if (!assetCollection) {
      throw new NotFoundException(
        `AssetCollection with id ${id} not found`,
      );
    }

    await this.assetCollectionRepository.manager.transaction(async (manager) => {
      await manager.delete(AssetCollection, id);
      await this.renumber(manager, assetCollection.collection.id);
    });
  }
}