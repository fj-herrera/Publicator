import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity.js';
import { CreateCollectionDto } from './dto/create-collection.dto.js';
import { UpdateCollectionDto } from './dto/update-collection.dto.js';
import { Publication } from '../../modules/publication/entities/publication.entity.js';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

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
    });

    return await this.collectionRepository.save(collection);
  }

  async findAll(): Promise<Collection[]> {
    return this.collectionRepository.find({
      relations: {
        publication: true,
      },
    });
  }

  async findOne(id: number): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: {
        publication: true,
      },
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
    const collection = await this.collectionRepository.findOneBy({ id });

    if (!collection) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }

    if (Object.keys(updateCollectionDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateCollectionDto.type !== undefined) {
      collection.type = updateCollectionDto.type;
    }

    if (updateCollectionDto.publicationId !== undefined) {
      const publication = await this.publicationRepository.findOneBy({
        id: updateCollectionDto.publicationId,
      });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${updateCollectionDto.publicationId} not found`,
        );
      }

      collection.publication = publication;
    }

    return await this.collectionRepository.save(collection);
  }

  async remove(id: number): Promise<void> {
    const result = await this.collectionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }
  }
}