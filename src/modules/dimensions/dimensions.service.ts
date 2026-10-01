import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dimensions } from './entities/dimensions.entity.js';
import { CreateDimensionsDto } from './dto/create-dimensions.dto.js';
import { UpdateDimensionsDto } from './dto/update-dimensions.dto.js';

@Injectable()
export class DimensionsService {
  constructor(
    @InjectRepository(Dimensions)
    private readonly dimensionsRepository: Repository<Dimensions>,
  ) {}

  async create(
    createDimensionsDto: CreateDimensionsDto,
  ): Promise<Dimensions> {
    try {
      const dimensions = this.dimensionsRepository.create(
        createDimensionsDto,
      );
      return await this.dimensionsRepository.save(dimensions);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Dimensions ${createDimensionsDto.width}x${createDimensionsDto.height} already exist`,
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Dimensions[]> {
    return this.dimensionsRepository.find();
  }

  async findOne(id: number): Promise<Dimensions> {
    const dimensions = await this.dimensionsRepository.findOneBy({ id });

    if (!dimensions) {
      throw new NotFoundException(`Dimensions with id ${id} not found`);
    }

    return dimensions;
  }

  async update(
    id: number,
    updateDimensionsDto: UpdateDimensionsDto,
  ): Promise<Dimensions> {
    const dimensions = await this.dimensionsRepository.findOneBy({ id });

    if (!dimensions) {
      throw new NotFoundException(`Dimensions with id ${id} not found`);
    }

    Object.assign(dimensions, updateDimensionsDto);

    try {
      return await this.dimensionsRepository.save(dimensions);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Dimensions ${updateDimensionsDto.width}x${updateDimensionsDto.height} already exist`,
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.dimensionsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Dimensions with id ${id} not found`);
    }
  }
}