import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationTag } from './entities/publication-tag.entity.js';
import { CreatePublicationTagDto } from './dto/create-publication-tag.dto.js';
import { UpdatePublicationTagDto } from './dto/update-publication-tag.dto.js';
import { Publication } from '../../modules/publication/entities/publication.entity.js';
import { Tag } from '../../modules/tag/entities/tag.entity.js';

@Injectable()
export class PublicationTagService {
  constructor(
    @InjectRepository(PublicationTag)
    private readonly publicationTagRepository: Repository<PublicationTag>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(
    createPublicationTagDto: CreatePublicationTagDto,
  ): Promise<PublicationTag> {
    const { publicationId, tagId } = createPublicationTagDto;

    const publication = await this.publicationRepository.findOneBy({
      id: publicationId,
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publicationId} not found`,
      );
    }

    const tag = await this.tagRepository.findOneBy({
      id: tagId,
    });

    if (!tag) {
      throw new NotFoundException(
        `Tag with id ${tagId} not found`,
      );
    }

    try {
      const publicationTag = this.publicationTagRepository.create({
        publication,
        tag,
      });

      return await this.publicationTagRepository.save(
        publicationTag,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Tag ${tagId} is already associated with Publication ${publicationId}`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<PublicationTag[]> {
    return this.publicationTagRepository.find({
      relations: {
        publication: true,
        tag: true,
      },
    });
  }

  async findOne(id: number): Promise<PublicationTag> {
    const publicationTag =
      await this.publicationTagRepository.findOne({
        where: { id },
        relations: {
          publication: true,
          tag: true,
        },
      });

    if (!publicationTag) {
      throw new NotFoundException(
        `PublicationTag with id ${id} not found`,
      );
    }

    return publicationTag;
  }

  async update(
    id: number,
    updatePublicationTagDto: UpdatePublicationTagDto,
  ): Promise<PublicationTag> {
    const publicationTag =
      await this.publicationTagRepository.findOneBy({ id });

    if (!publicationTag) {
      throw new NotFoundException(
        `PublicationTag with id ${id} not found`,
      );
    }

    if (Object.keys(updatePublicationTagDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updatePublicationTagDto.publicationId !== undefined) {
      const publication =
        await this.publicationRepository.findOneBy({
          id: updatePublicationTagDto.publicationId,
        });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${updatePublicationTagDto.publicationId} not found`,
        );
      }

      publicationTag.publication = publication;
    }

    if (updatePublicationTagDto.tagId !== undefined) {
      const tag = await this.tagRepository.findOneBy({
        id: updatePublicationTagDto.tagId,
      });

      if (!tag) {
        throw new NotFoundException(
          `Tag with id ${updatePublicationTagDto.tagId} not found`,
        );
      }

      publicationTag.tag = tag;
    }

    try {
      return await this.publicationTagRepository.save(
        publicationTag,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'This Tag is already associated with this Publication',
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result =
      await this.publicationTagRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `PublicationTag with id ${id} not found`,
      );
    }
  }
}