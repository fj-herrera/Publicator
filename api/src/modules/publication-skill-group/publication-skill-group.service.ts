import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationSkillGroup } from './entities/publication-skill-group.entity.js';
import { CreatePublicationSkillGroupDto } from './dto/create-publication-skill-group.dto.js';
import { UpdatePublicationSkillGroupDto } from './dto/update-publication-skill-group.dto.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { SkillGroup } from '../skill-group/entities/skill-group.entity.js';

@Injectable()
export class PublicationSkillGroupService {
  constructor(
    @InjectRepository(PublicationSkillGroup)
    private readonly publicationSkillGroupRepository: Repository<PublicationSkillGroup>,
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
    @InjectRepository(SkillGroup)
    private readonly skillGroupRepository: Repository<SkillGroup>,
  ) {}

  async create(dto: CreatePublicationSkillGroupDto): Promise<PublicationSkillGroup> {
    const publication = await this.publicationRepository.findOneBy({ id: dto.publicationId })
    if (!publication) {
      throw new NotFoundException(`Publication with id ${dto.publicationId} not found`)
    }

    const skillGroup = await this.skillGroupRepository.findOneBy({ id: dto.skillGroupId })
    if (!skillGroup) {
      throw new NotFoundException(`SkillGroup with id ${dto.skillGroupId} not found`)
    }

    try {
      return await this.publicationSkillGroupRepository.save(
        this.publicationSkillGroupRepository.create({ publication, skillGroup }),
      )
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException('This skill group is already assigned to this publication.')
      }
      throw error
    }
  }

  async findAll(): Promise<PublicationSkillGroup[]> {
    return this.publicationSkillGroupRepository.find({
      relations: { publication: true, skillGroup: true },
    })
  }

  async findOne(id: number): Promise<PublicationSkillGroup> {
    const relation = await this.publicationSkillGroupRepository.findOne({
      where: { id },
      relations: { publication: true, skillGroup: true },
    })
    if (!relation) {
      throw new NotFoundException(`PublicationSkillGroup with id ${id} not found`)
    }
    return relation
  }

  async update(id: number, dto: UpdatePublicationSkillGroupDto): Promise<PublicationSkillGroup> {
    const relation = await this.publicationSkillGroupRepository.findOneBy({ id })
    if (!relation) {
      throw new NotFoundException(`PublicationSkillGroup with id ${id} not found`)
    }
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No fields to update')
    }

    if (dto.publicationId !== undefined) {
      const publication = await this.publicationRepository.findOneBy({ id: dto.publicationId })
      if (!publication) {
        throw new NotFoundException(`Publication with id ${dto.publicationId} not found`)
      }
      relation.publication = publication
    }
    if (dto.skillGroupId !== undefined) {
      const skillGroup = await this.skillGroupRepository.findOneBy({ id: dto.skillGroupId })
      if (!skillGroup) {
        throw new NotFoundException(`SkillGroup with id ${dto.skillGroupId} not found`)
      }
      relation.skillGroup = skillGroup
    }

    try {
      return await this.publicationSkillGroupRepository.save(relation)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException('This skill group is already assigned to this publication.')
      }
      throw error
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.publicationSkillGroupRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException(`PublicationSkillGroup with id ${id} not found`)
    }
  }
}