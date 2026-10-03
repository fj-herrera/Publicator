import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity.js';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { Publication } from '../../modules/publication/entities/publication.entity.js';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const { publication_id } = createContentDto;

    if (publication_id !== undefined) {
      const publication = await this.publicationRepository.findOneBy({
        id: publication_id,
      });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${publication_id} not found`,
        );
      }

      const content = this.contentRepository.create({
        publication,
      });

      return await this.contentRepository.save(content);
    }

    const content = this.contentRepository.create();

    return await this.contentRepository.save(content);
  }

  async findAll(): Promise<Content[]> {
    return this.contentRepository.find({
      relations: {
        publication: true,
      },
    });
  }

  async findOne(id: number): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: {
        publication: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with id ${id} not found`);
    }

    return content;
  }

  async update(
    id: number,
    updateContentDto: UpdateContentDto,
  ): Promise<Content> {
    const content = await this.contentRepository.findOneBy({ id });

    if (!content) {
      throw new NotFoundException(`Content with id ${id} not found`);
    }

    if (Object.keys(updateContentDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateContentDto.publication_id !== undefined) {
      const publication = await this.publicationRepository.findOneBy({
        id: updateContentDto.publication_id,
      });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${updateContentDto.publication_id} not found`,
        );
      }

      content.publication = publication;
    }

    return await this.contentRepository.save(content);
  }

  async remove(id: number): Promise<void> {
    const result = await this.contentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Content with id ${id} not found`);
    }
  }
}