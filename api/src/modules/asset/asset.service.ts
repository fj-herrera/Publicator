import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { Dimensions } from '../../modules/dimensions/entities/dimensions.entity.js';
import { MediaStorageService, type StoredFile } from '../media/media-storage.service.js';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,

    @InjectRepository(Dimensions)
    private readonly dimensionsRepository: Repository<Dimensions>,

    private readonly mediaStorage: MediaStorageService,
  ) {}

  async findOrCreateDimensions(width: number, height: number): Promise<Dimensions> {
    const existingDimensions = await this.dimensionsRepository.findOneBy({ width, height });
    if (existingDimensions) {
      return existingDimensions;
    }

    try {
      const dimensions = this.dimensionsRepository.create({ width, height });
      return await this.dimensionsRepository.save(dimensions);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        const dimensionsCreatedConcurrently = await this.dimensionsRepository.findOneBy({
          width,
          height,
        });
        if (dimensionsCreatedConcurrently) {
          return dimensionsCreatedConcurrently;
        }
      }

      throw error;
    }
  }

  async create(
    createAssetDto: CreateAssetDto,
  ): Promise<Asset> {
    const { dimensionsId, ...data } = createAssetDto;

    let dimensions: Dimensions | null = null;

    if (dimensionsId !== undefined) {
      dimensions = await this.dimensionsRepository.findOneBy({
        id: dimensionsId,
      });

      if (!dimensions) {
        throw new NotFoundException(
          `Dimensions with id ${dimensionsId} not found`,
        );
      }
    }

    try {
      const asset = this.assetRepository.create({
        ...data,
        dimensions,
        uploadedAt: new Date(),
      });

      return await this.assetRepository.manager.transaction(async (manager) => {
        await this.mediaStorage.assertAssignable(asset.url, 'assets', manager);

        return manager.save(Asset, asset);
      });
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Asset with url "${createAssetDto.url}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<Asset[]> {
    return this.assetRepository.find({
      relations: {
        dimensions: true,
      },
    });
  }

  async findOne(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: {
        dimensions: true,
      },
    });

    if (!asset) {
      throw new NotFoundException(
        `Asset with id ${id} not found`,
      );
    }

    return asset;
  }

  async update(
    id: number,
    updateAssetDto: UpdateAssetDto,
  ): Promise<Asset> {
    const filesToDelete: StoredFile[] = [];

    try {
      const saved = await this.assetRepository.manager.transaction(async (manager) => {
        const asset = await manager.findOne(Asset, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
          loadEagerRelations: false,
        });

        if (!asset) {
          throw new NotFoundException(
            `Asset with id ${id} not found`,
          );
        }

        if (Object.keys(updateAssetDto).length === 0) {
          throw new BadRequestException('No fields to update');
        }

        const previousUrl = asset.url;

        if (updateAssetDto.type !== undefined) {
          asset.type = updateAssetDto.type;
        }

        if (updateAssetDto.name !== undefined) {
          asset.name = updateAssetDto.name;
        }

        if (updateAssetDto.url !== undefined) {
          asset.url = updateAssetDto.url;
        }

        if (updateAssetDto.dimensionsId !== undefined) {
          const dimensions = await manager.findOneBy(Dimensions, {
            id: updateAssetDto.dimensionsId,
          });

          if (!dimensions) {
            throw new NotFoundException(
              `Dimensions with id ${updateAssetDto.dimensionsId} not found`,
            );
          }

          asset.dimensions = dimensions;
        }

        if (asset.url !== previousUrl) {
          await this.mediaStorage.assertAssignable(asset.url, 'assets', manager);
        }

        const result = await manager.save(Asset, asset);

        if (previousUrl !== result.url) {
          filesToDelete.push({ url: previousUrl, folder: 'assets' });
        }

        return result;
      });

      // Runs after COMMIT and never throws; the old file is removed only if nothing references it anymore.
      await this.mediaStorage.deleteUnreferencedFiles(filesToDelete);

      return saved;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Asset with url "${updateAssetDto.url}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const filesToDelete: StoredFile[] = [];

    await this.assetRepository.manager.transaction(async (manager) => {
      const asset = await manager.findOne(Asset, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!asset) {
        throw new NotFoundException(
          `Asset with id ${id} not found`,
        );
      }

      try {
        await manager.delete(Asset, id);
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === '23503'
        ) {
          throw new ConflictException(
            'Asset cannot be deleted while it has associations.',
          );
        }

        throw error;
      }

      filesToDelete.push({ url: asset.url, folder: 'assets' });
    });

    // Runs after COMMIT and never throws: a failed unlink leaves an orphan file, never a broken reference.
    await this.mediaStorage.deleteUnreferencedFiles(filesToDelete);
  }
}
