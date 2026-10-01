import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meta } from './entities/meta.entity.js';
import { Client } from '../client/entities/client.entity.js';
import { CreateMetaDto } from './dto/create-meta.dto.js';
import { UpdateMetaDto } from './dto/update-meta.dto.js';

@Injectable()
export class MetaService {
  constructor(
    @InjectRepository(Meta)
    private readonly metaRepository: Repository<Meta>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createMetaDto: CreateMetaDto): Promise<Meta> {
  try {
    const { client_id, ...data } = createMetaDto;

    if (client_id) {
      const client = await this.clientRepository.findOneBy({
        id: client_id,
      });

      if (!client) {
        throw new NotFoundException(
          `Client with id ${client_id} not found`,
        );
      }
    }

    const meta = this.metaRepository.create({
      ...data,
      ...(client_id ? { client: { id: client_id } } : {}),
    });

    return await this.metaRepository.save(meta);
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ConflictException(
        `Meta with slug "${createMetaDto.slug}" already exists`,
      );
    }

    throw error;
  }
}

  async findAll(): Promise<Meta[]> {
    return this.metaRepository.find({
      relations: {
        client: true,
      },
    });
  }

  async findOne(id: number): Promise<Meta> {
    const meta = await this.metaRepository.findOne({
      where: { id },
      relations: {
        client: true,
      },
    });

    if (!meta) {
      throw new NotFoundException(`Meta with id ${id} not found`);
    }

    return meta;
  }

  async update(
    id: number,
    updateMetaDto: UpdateMetaDto,
  ): Promise<Meta> {
    const meta = await this.metaRepository.findOneBy({ id });

    if (!meta) {
      throw new NotFoundException(`Meta with id ${id} not found`);
    }

    Object.assign(meta, updateMetaDto);

    try {
      return await this.metaRepository.save(meta);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Meta with slug "${updateMetaDto.slug}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.metaRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Meta with id ${id} not found`);
    }
  }
}