import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateContextDto } from './dto/create-context.dto.js';
import { UpdateContextDto } from './dto/update-context.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from './entities/context.entity.js';
import { PublicationContext } from '../publication-context/entities/publication-context.entity.js';

@Injectable()
export class ContextService {
  constructor(
    @InjectRepository(Context)
    private readonly contextRepository: Repository<Context>,

    @InjectRepository(PublicationContext)
    private readonly publicationContextRepository: Repository<PublicationContext>,
  ) {}

  async create(name: string): Promise<Context> {
    try {
      const context = this.contextRepository.create({ name });

      return await this.contextRepository.save(context);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Context with name "${name}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<(Context & { inPublications: number })[]> {
    const contexts = await this.contextRepository.find();
    const publicationCounts = await this.publicationContextRepository
      .createQueryBuilder('publicationContext')
      .select('context.id', 'contextId')
      .addSelect('COUNT(publicationContext.id)', 'count')
      .innerJoin('publicationContext.context', 'context')
      .groupBy('context.id')
      .getRawMany<{ contextId: number; count: string }>();
    const countsByContextId = new Map(
      publicationCounts.map(({ contextId, count }) => [Number(contextId), Number(count)]),
    );

    return contexts.map((context) => ({
      ...context,
      inPublications: countsByContextId.get(context.id) ?? 0,
    }));
  }

  async findOne(id: number): Promise<Context> {
    const context = await this.contextRepository.findOneBy({ id });

      if (!context) {
        throw new NotFoundException(`Context with id ${id} not found`);
      }

    return context;
  }

  async update(id: number, updateContextDto: UpdateContextDto): Promise<Context> {
    if (Object.keys(updateContextDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const context = await this.contextRepository.findOneBy({ id });

    if (!context) {
      throw new NotFoundException(`Context with id ${id} not found`);
    }

    Object.assign(context, updateContextDto);

    try {
      return await this.contextRepository.save(context);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Context with name "${updateContextDto.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.contextRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Context with id ${id} not found`);
    }
  }
}
