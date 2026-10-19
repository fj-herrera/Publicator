import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetCollection } from './entities/asset-collection.entity.js';
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

    try {
      const assetCollection =
        this.assetCollectionRepository.create({
          role,
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
        asset: true,
      },
    });
  }

  async findOne(id: number): Promise<AssetCollection> {
    const assetCollection =
      await this.assetCollectionRepository.findOne({
        where: { id },
        relations: {
          collection: true,
          asset: true,
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
      await this.assetCollectionRepository.findOneBy({ id });

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

    if (
      updateAssetCollectionDto.collectionId !== undefined
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

      assetCollection.collection = collection;
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
          'This Asset is already associated with this Collection using this role',
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result =
      await this.assetCollectionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `AssetCollection with id ${id} not found`,
      );
    }
  }
}