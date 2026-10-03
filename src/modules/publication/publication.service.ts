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
      const { type_id, meta_id } = createPublicationDto;

      const type = await this.typeRepository.findOneBy({ id: type_id });

      if (!type) {
        throw new NotFoundException(`Type with id ${type_id} not found`);
      }

      const meta = await this.metaRepository.findOneBy({ id: meta_id });

      if (!meta) {
        throw new NotFoundException(`Meta with id ${meta_id} not found`);
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
          `Meta with id ${createPublicationDto.meta_id} is already associated with a publication`,
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
    const { type_id, meta_id } = updatePublicationDto;

    if (type_id !== undefined) {
      const type = await this.typeRepository.findOneBy({ id: type_id });

      if (!type) {
        throw new NotFoundException(`Type with id ${type_id} not found`);
      }

      publication.type = type;
    }

    if (meta_id !== undefined) {
      const meta = await this.metaRepository.findOneBy({ id: meta_id });

      if (!meta) {
        throw new NotFoundException(`Meta with id ${meta_id} not found`);
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
          `Meta with id ${meta_id} is already associated with a publication`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.publicationRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Publication with id ${id} not found`);
    }
  }
}