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

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,

    @InjectRepository(Dimensions)
    private readonly dimensionsRepository: Repository<Dimensions>,
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

      return await this.assetRepository.save(asset);
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
    const asset = await this.assetRepository.findOneBy({ id });

    if (!asset) {
      throw new NotFoundException(
        `Asset with id ${id} not found`,
      );
    }

    if (Object.keys(updateAssetDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

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
      const dimensions =
        await this.dimensionsRepository.findOneBy({
          id: updateAssetDto.dimensionsId,
        });

      if (!dimensions) {
        throw new NotFoundException(
          `Dimensions with id ${updateAssetDto.dimensionsId} not found`,
        );
      }

      asset.dimensions = dimensions;
    }

    try {
      return await this.assetRepository.save(asset);
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
    const result = await this.assetRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Asset with id ${id} not found`,
      );
    }
  }
}