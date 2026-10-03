import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetText } from './entities/asset-text.entity.js';
import { CreateAssetTextDto } from './dto/create-asset-text.dto.js';
import { UpdateAssetTextDto } from './dto/update-asset-text.dto.js';
import { Asset } from '../../modules/asset/entities/asset.entity.js';
import { Text } from '../../modules/text/entities/text.entity.js';

@Injectable()
export class AssetTextService {
  constructor(
    @InjectRepository(AssetText)
    private readonly assetTextRepository: Repository<AssetText>,

    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,

    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
  ) {}

  async create(
    createAssetTextDto: CreateAssetTextDto,
  ): Promise<AssetText> {
    const {
      asset_id,
      text_id,
      type,
    } = createAssetTextDto;

    const asset = await this.assetRepository.findOneBy({
      id: asset_id,
    });

    if (!asset) {
      throw new NotFoundException(
        `Asset with id ${asset_id} not found`,
      );
    }

    const text = await this.textRepository.findOneBy({
      id: text_id,
    });

    if (!text) {
      throw new NotFoundException(
        `Text with id ${text_id} not found`,
      );
    }

    try {
      const assetText = this.assetTextRepository.create({
        type,
        asset,
        text,
      });

      return await this.assetTextRepository.save(assetText);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Text ${text_id} is already associated with Asset ${asset_id} using type "${type}"`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<AssetText[]> {
    return this.assetTextRepository.find({
      relations: {
        asset: true,
        text: true,
      },
    });
  }

  async findOne(id: number): Promise<AssetText> {
    const assetText = await this.assetTextRepository.findOne({
      where: { id },
      relations: {
        asset: true,
        text: true,
      },
    });

    if (!assetText) {
      throw new NotFoundException(
        `AssetText with id ${id} not found`,
      );
    }

    return assetText;
  }

  async update(
    id: number,
    updateAssetTextDto: UpdateAssetTextDto,
  ): Promise<AssetText> {
    const assetText = await this.assetTextRepository.findOneBy({
      id,
    });

    if (!assetText) {
      throw new NotFoundException(
        `AssetText with id ${id} not found`,
      );
    }

    if (Object.keys(updateAssetTextDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateAssetTextDto.type !== undefined) {
      assetText.type = updateAssetTextDto.type;
    }

    if (updateAssetTextDto.asset_id !== undefined) {
      const asset = await this.assetRepository.findOneBy({
        id: updateAssetTextDto.asset_id,
      });

      if (!asset) {
        throw new NotFoundException(
          `Asset with id ${updateAssetTextDto.asset_id} not found`,
        );
      }

      assetText.asset = asset;
    }

    if (updateAssetTextDto.text_id !== undefined) {
      const text = await this.textRepository.findOneBy({
        id: updateAssetTextDto.text_id,
      });

      if (!text) {
        throw new NotFoundException(
          `Text with id ${updateAssetTextDto.text_id} not found`,
        );
      }

      assetText.text = text;
    }

    try {
      return await this.assetTextRepository.save(assetText);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'This Text is already associated with this Asset using this type',
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.assetTextRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `AssetText with id ${id} not found`,
      );
    }
  }
}
