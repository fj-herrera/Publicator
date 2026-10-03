import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skills } from './entities/skills.entity.js';
import { CreateSkillsDto } from './dto/create-skills.dto.js';
import { UpdateSkillsDto } from './dto/update-skills.dto.js';
import { Publication } from '../../modules/publication/entities/publication.entity.js';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skills)
    private readonly skillsRepository: Repository<Skills>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  async create(createSkillsDto: CreateSkillsDto): Promise<Skills> {
    const { publication_id } = createSkillsDto;

    const publication = await this.publicationRepository.findOneBy({
      id: publication_id,
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publication_id} not found`,
      );
    }

    const skills = this.skillsRepository.create({
      publication,
    });

    return await this.skillsRepository.save(skills);
  }

  async findAll(): Promise<Skills[]> {
    return this.skillsRepository.find({
      relations: {
        publication: true,
      },
    });
  }

  async findOne(id: number): Promise<Skills> {
    const skills = await this.skillsRepository.findOne({
      where: { id },
      relations: {
        publication: true,
      },
    });

    if (!skills) {
      throw new NotFoundException(`Skills with id ${id} not found`);
    }

    return skills;
  }

  async update(
    id: number,
    updateSkillsDto: UpdateSkillsDto,
  ): Promise<Skills> {
    const skills = await this.skillsRepository.findOneBy({ id });

    if (!skills) {
      throw new NotFoundException(`Skills with id ${id} not found`);
    }

    if (Object.keys(updateSkillsDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateSkillsDto.publication_id !== undefined) {
      const publication = await this.publicationRepository.findOneBy({
        id: updateSkillsDto.publication_id,
      });

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${updateSkillsDto.publication_id} not found`,
        );
      }

      skills.publication = publication;
    }

    return await this.skillsRepository.save(skills);
  }

  async remove(id: number): Promise<void> {
    const result = await this.skillsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Skills with id ${id} not found`);
    }
  }
}