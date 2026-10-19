import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationSkills } from './entities/publication-skills.entity.js';
import { CreatePublicationSkillsDto } from './dto/create-publication-skills.dto.js';
import { UpdatePublicationSkillsDto } from './dto/update-publication-skills.dto.js';
import { Publication } from '../publication/entities/publication.entity.js';

@Injectable()
export class PublicationSkillsService {
  constructor(
    @InjectRepository(PublicationSkills)
    private readonly publicationSkillsRepository: Repository<PublicationSkills>,
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  async create(
    createPublicationSkillsDto: CreatePublicationSkillsDto,
  ): Promise<PublicationSkills> {
    const { publicationId } = createPublicationSkillsDto;
    const publication = await this.publicationRepository.findOneBy({
      id: publicationId,
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publicationId} not found`,
      );
    }

    const publicationSkills = this.publicationSkillsRepository.create({
      publication,
    });

    return this.publicationSkillsRepository.save(publicationSkills);
  }

  async findAll(): Promise<PublicationSkills[]> {
    return this.publicationSkillsRepository.find({
      relations: {
        publication: true,
      },
    });
  }

  async findOne(id: number): Promise<PublicationSkills> {
    const publicationSkills = await this.publicationSkillsRepository.findOne({
      where: { id },
      relations: {
        publication: true,
      },
    });

    if (!publicationSkills) {
      throw new NotFoundException(
        `PublicationSkills with id ${id} not found`,
      );
    }

    return publicationSkills;
  }

  async update(
    id: number,
    updatePublicationSkillsDto: UpdatePublicationSkillsDto,
  ): Promise<PublicationSkills> {
    const publicationSkills = await this.publicationSkillsRepository.findOneBy({
      id,
    });

    if (!publicationSkills) {
      throw new NotFoundException(
        `PublicationSkills with id ${id} not found`,
      );
    }

    if (Object.keys(updatePublicationSkillsDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updatePublicationSkillsDto.publicationId !== undefined) {
      const publication = await this.publicationRepository.findOneBy({
        id: updatePublicationSkillsDto.publicationId,
      });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${updatePublicationSkillsDto.publicationId} not found`,
        );
      }

      publicationSkills.publication = publication;
    }

    return this.publicationSkillsRepository.save(publicationSkills);
  }

  async remove(id: number): Promise<void> {
    const result = await this.publicationSkillsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `PublicationSkills with id ${id} not found`,
      );
    }
  }
}