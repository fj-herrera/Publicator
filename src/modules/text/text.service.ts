import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTextDto } from './dto/create-text.dto.js';
import { UpdateTextDto } from './dto/update-text.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text } from './entities/text.entity.js';

@Injectable()
export class TextService {
  constructor(
    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
  ) {}

  async create(createTextDto: CreateTextDto): Promise<Text> {
    try {
      const newText = this.textRepository.create(createTextDto);

      return await this.textRepository.save(newText);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Text with content "${createTextDto.text}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll() : Promise<Text[]> {
    return this.textRepository.find();
  }

  async findOne(id: number): Promise<Text> {
    const text = await this.textRepository.findOneBy({ id });

      if (!text) {
        throw new NotFoundException(`Text with id ${id} not found`);
      }

    return text;
  }

  async update(id: number, updateTextDto: UpdateTextDto): Promise<Text> {
    if (Object.keys(updateTextDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const text = await this.textRepository.findOneBy({ id });

    if (!text) {
      throw new NotFoundException(`Text with id ${id} not found`);
    }

    Object.assign(text, updateTextDto);

    try {
      return await this.textRepository.save(text);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Text with content "${updateTextDto.text}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.textRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Text with id ${id} not found`);
    }
  }
}
