import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationAsset } from './entities/publication-asset.entity.js';
import { CreatePublicationAssetDto } from './dto/create-publication-asset.dto.js';
import { UpdatePublicationAssetDto } from './dto/update-publication-asset.dto.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { Asset } from '../asset/entities/asset.entity.js';

@Injectable()
export class PublicationAssetService {
  constructor(
    @InjectRepository(PublicationAsset)
    private readonly publicationAssetRepository: Repository<PublicationAsset>,
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  async create(
    createPublicationAssetDto: CreatePublicationAssetDto,
  ): Promise<PublicationAsset> {
    const { publication_id, asset_id, role } = createPublicationAssetDto;
    const publication = await this.publicationRepository.findOneBy({
      id: publication_id,
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publication_id} not found`,
      );
    }

    const asset = await this.assetRepository.findOneBy({ id: asset_id });

    if (!asset) {
      throw new NotFoundException(`Asset with id ${asset_id} not found`);
    }

    try {
      const publicationAsset = this.publicationAssetRepository.create({
        publication,
        asset,
        role,
      });

      return await this.publicationAssetRepository.save(publicationAsset);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Asset ${asset_id} with role "${role}" is already associated with Publication ${publication_id}`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<PublicationAsset[]> {
    return this.publicationAssetRepository.find({
      relations: {
        publication: true,
        asset: true,
      },
    });
  }

  async findOne(id: number): Promise<PublicationAsset> {
    const publicationAsset = await this.publicationAssetRepository.findOne({
      where: { id },
      relations: {
        publication: true,
        asset: true,
      },
    });

    if (!publicationAsset) {
      throw new NotFoundException(`PublicationAsset with id ${id} not found`);
    }

    return publicationAsset;
  }

  async update(
    id: number,
    updatePublicationAssetDto: UpdatePublicationAssetDto,
  ): Promise<PublicationAsset> {
    const publicationAsset = await this.publicationAssetRepository.findOneBy({
      id,
    });

    if (!publicationAsset) {
      throw new NotFoundException(`PublicationAsset with id ${id} not found`);
    }

    if (Object.keys(updatePublicationAssetDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updatePublicationAssetDto.publication_id !== undefined) {
      const publication = await this.publicationRepository.findOneBy({
        id: updatePublicationAssetDto.publication_id,
      });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${updatePublicationAssetDto.publication_id} not found`,
        );
      }

      publicationAsset.publication = publication;
    }

    if (updatePublicationAssetDto.asset_id !== undefined) {
      const asset = await this.assetRepository.findOneBy({
        id: updatePublicationAssetDto.asset_id,
      });

      if (!asset) {
        throw new NotFoundException(
          `Asset with id ${updatePublicationAssetDto.asset_id} not found`,
        );
      }

      publicationAsset.asset = asset;
    }

    if (updatePublicationAssetDto.role !== undefined) {
      publicationAsset.role = updatePublicationAssetDto.role;
    }

    try {
      return await this.publicationAssetRepository.save(publicationAsset);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'This Asset is already associated with this Publication using this role',
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.publicationAssetRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`PublicationAsset with id ${id} not found`);
    }
  }
}