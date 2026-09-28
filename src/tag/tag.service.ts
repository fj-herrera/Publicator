import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity.js';


@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
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

  async findAll() : Promise<Tag[]> {
    return this.tagRepository.find();
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.tagRepository.findOneBy({ id });

      if (!tag) {
        throw new NotFoundException(`Tag with id ${id} not found`);
      }

    return tag;
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<Tag> {
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
