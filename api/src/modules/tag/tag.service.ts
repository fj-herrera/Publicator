import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity.js';
import { PublicationTag } from '../publication-tag/entities/publication-tag.entity.js';


@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,

    @InjectRepository(PublicationTag)
    private readonly publicationTagRepository: Repository<PublicationTag>,
  ) {}

  async create(name: string): Promise<Tag> {
    try {
      const tag = this.tagRepository.create({ name });

      return await this.tagRepository.save(tag);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Tag with name "${name}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<(Tag & { inPublications: number })[]> {
    const tags = await this.tagRepository.find();
    const publicationCounts = await this.publicationTagRepository
      .createQueryBuilder('publicationTag')
      .select('tag.id', 'tagId')
      .addSelect('COUNT(publicationTag.id)', 'count')
      .innerJoin('publicationTag.tag', 'tag')
      .groupBy('tag.id')
      .getRawMany<{ tagId: number; count: string }>();
    const countsByTagId = new Map(
      publicationCounts.map(({ tagId, count }) => [Number(tagId), Number(count)]),
    );

    return tags.map((tag) => ({
      ...tag,
      inPublications: countsByTagId.get(tag.id) ?? 0,
    }));
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.tagRepository.findOneBy({ id });

      if (!tag) {
        throw new NotFoundException(`Tag with id ${id} not found`);
      }

    return tag;
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<Tag> {
    if (Object.keys(updateTagDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const tag = await this.tagRepository.findOneBy({ id });

    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    Object.assign(tag, updateTagDto);

    try {
      return await this.tagRepository.save(tag);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Tag with name "${updateTagDto.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.tagRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }
  }
}
