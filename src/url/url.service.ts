import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto.js';
import { UpdateUrlDto } from './dto/update-url.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity.js';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    private readonly textRepository: Repository<Url>,
  ) {}

  async create(text: string): Promise<Url> {
    try {
      const newUrl = this.textRepository.create({ text });

      return await this.textRepository.save(newUrl);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Url with content "${text}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll() : Promise<Url[]> {
    return this.textRepository.find();
  }

  async findOne(id: number): Promise<Url> {
    const url = await this.textRepository.findOneBy({ id });

      if (!url) {
        throw new NotFoundException(`Url with id ${id} not found`);
      }

    return url;
  }

  async update(id: number, updateUrlDto: UpdateUrlDto): Promise<Url> {
    const url = await this.textRepository.findOneBy({ id });

    if (!url) {
      throw new NotFoundException(`Url with id ${id} not found`);
    }

    Object.assign(url, updateUrlDto);

    try {
      return await this.textRepository.save(url);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Url with content "${updateUrlDto.text}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.textRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Url with id ${id} not found`);
    }
  }
}
