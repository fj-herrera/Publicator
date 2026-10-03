import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTypeDto } from './dto/create-type.dto.js';
import { UpdateTypeDto } from './dto/update-type.dto.js';
import { Repository } from 'typeorm';
import { Type } from './entities/type.entity.js';


@Injectable()
export class TypeService {
  constructor(
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
  ) {}

  async create(name: string): Promise<Type> {
    try {
      const type = this.typeRepository.create({ name });

      return await this.typeRepository.save(type);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Type with name "${name}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll() : Promise<Type[]> {
    return this.typeRepository.find();
  }

  async findOne(id: number): Promise<Type> {
    const type = await this.typeRepository.findOneBy({ id });

      if (!type) {
        throw new NotFoundException(`Type with id ${id} not found`);
      }

    return type;
  }

  async update(id: number, updateTypeDto: UpdateTypeDto): Promise<Type> {
    if (Object.keys(updateTypeDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const type = await this.typeRepository.findOneBy({ id });

    if (!type) {
      throw new NotFoundException(`Type with id ${id} not found`);
    }

    Object.assign(type, updateTypeDto);

    try {
      return await this.typeRepository.save(type);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Type with name "${updateTypeDto.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.typeRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Type with id ${id} not found`);
    }
  }
}
