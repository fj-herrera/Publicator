import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationContext } from './entities/publication-context.entity.js';
import { CreatePublicationContextDto } from './dto/create-publication-context.dto.js';
import { UpdatePublicationContextDto } from './dto/update-publication-context.dto.js';
import { Publication } from '../../modules/publication/entities/publication.entity.js';
import { Context } from '../../modules/context/entities/context.entity.js';

@Injectable()
export class PublicationContextService {
  constructor(
    @InjectRepository(PublicationContext)
    private readonly publicationContextRepository: Repository<PublicationContext>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,

    @InjectRepository(Context)
    private readonly contextRepository: Repository<Context>,
  ) {}

  async create(
    createPublicationContextDto: CreatePublicationContextDto,
  ): Promise<PublicationContext> {
    const {
      position,
      visible,
      featured,
      publication_id,
      context_id,
    } = createPublicationContextDto;

    const publication = await this.publicationRepository.findOneBy({
      id: publication_id,
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publication_id} not found`,
      );
    }

    const context = await this.contextRepository.findOneBy({
      id: context_id,
    });

    if (!context) {
      throw new NotFoundException(
        `Context with id ${context_id} not found`,
      );
    }

    try {
      const publicationContext =
        this.publicationContextRepository.create({
          position,
          visible,
          featured,
          publication,
          context,
        });

      return await this.publicationContextRepository.save(
        publicationContext,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Context ${context_id} is already associated with Publication ${publication_id}`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<PublicationContext[]> {
    return this.publicationContextRepository.find({
      relations: {
        publication: true,
        context: true,
      },
    });
  }

  async findOne(id: number): Promise<PublicationContext> {
    const publicationContext =
      await this.publicationContextRepository.findOne({
        where: { id },
        relations: {
          publication: true,
          context: true,
        },
      });

    if (!publicationContext) {
      throw new NotFoundException(
        `PublicationContext with id ${id} not found`,
      );
    }

    return publicationContext;
  }

 async update(
  id: number,
  updatePublicationContextDto: UpdatePublicationContextDto,
): Promise<PublicationContext> {
  const publicationContext =
    await this.publicationContextRepository.findOne({
      where: { id },
      relations: {
        publication: true,
        context: true,
      },
    });

  if (!publicationContext) {
    throw new NotFoundException(
      `PublicationContext with id ${id} not found`,
    );
  }

  if (Object.keys(updatePublicationContextDto).length === 0) {
    throw new BadRequestException('No fields to update');
  }

  // Comprobar cambio de Publication
  if (updatePublicationContextDto.publication_id !== undefined) {
    const publication =
      await this.publicationRepository.findOneBy({
        id: updatePublicationContextDto.publication_id,
      });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${updatePublicationContextDto.publication_id} not found`,
      );
    }

    publicationContext.publication = publication;
  }

  // Comprobar cambio de Context
  if (updatePublicationContextDto.context_id !== undefined) {
    const context = await this.contextRepository.findOneBy({
      id: updatePublicationContextDto.context_id,
    });

    if (!context) {
      throw new NotFoundException(
        `Context with id ${updatePublicationContextDto.context_id} not found`,
      );
    }

    publicationContext.context = context;
  }

  // Comprobar cambio de Position
  if (updatePublicationContextDto.position !== undefined) {
    const contextId = publicationContext.context.id;

    const existing =
      await this.publicationContextRepository.findOne({
        where: {
          context: { id: contextId },
          position: updatePublicationContextDto.position,
        },
      });

    if (existing && existing.id !== id) {
      throw new ConflictException(
        `Position ${updatePublicationContextDto.position} is already used in Context ${contextId}`,
      );
    }

    publicationContext.position =
      updatePublicationContextDto.position;
  }

  // Actualizar visible
  if (updatePublicationContextDto.visible !== undefined) {
    publicationContext.visible =
      updatePublicationContextDto.visible;
  }

  // Actualizar featured
  if (updatePublicationContextDto.featured !== undefined) {
    publicationContext.featured =
      updatePublicationContextDto.featured;
  }

  try {
    return await this.publicationContextRepository.save(
      publicationContext,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ConflictException(
        'This Publication is already associated with this Context',
      );
    }

    throw error;
  }
}

  async remove(id: number): Promise<void> {
    const result =
      await this.publicationContextRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `PublicationContext with id ${id} not found`,
      );
    }
  }
}