import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillGroup } from './entities/skill-group.entity.js';
import { CreateSkillGroupDto } from './dto/create-skill-group.dto.js';
import { UpdateSkillGroupDto } from './dto/update-skill-group.dto.js';
import { PublicationSkills } from '../../modules/publication-skills/entities/publication-skills.entity.js';
import { Skill } from '../../modules/skill/entities/skill.entity.js';

@Injectable()
export class SkillGroupService {
  constructor(
    @InjectRepository(SkillGroup)
    private readonly skillGroupRepository: Repository<SkillGroup>,

    @InjectRepository(PublicationSkills)
    private readonly publicationSkillsRepository: Repository<PublicationSkills>,

    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(
    createSkillGroupDto: CreateSkillGroupDto,
  ): Promise<SkillGroup> {
    const { publicationSkillsId, skillId } = createSkillGroupDto;

    const publicationSkills = await this.publicationSkillsRepository.findOneBy({
      id: publicationSkillsId,
    });

    if (!publicationSkills) {
      throw new NotFoundException(
        `PublicationSkills with id ${publicationSkillsId} not found`,
      );
    }

    const skill = await this.skillRepository.findOneBy({
      id: skillId,
    });

    if (!skill) {
      throw new NotFoundException(
        `Skill with id ${skillId} not found`,
      );
    }

    try {
      const skillGroup = this.skillGroupRepository.create({
        publicationSkills,
        skill,
      });

      return await this.skillGroupRepository.save(skillGroup);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Skill ${skillId} is already associated with PublicationSkills ${publicationSkillsId}`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<SkillGroup[]> {
    return this.skillGroupRepository.find({
      relations: {
        publicationSkills: true,
        skill: true,
      },
    });
  }

  async findOne(id: number): Promise<SkillGroup> {
    const skillGroup = await this.skillGroupRepository.findOne({
      where: { id },
      relations: {
        publicationSkills: true,
        skill: true,
      },
    });

    if (!skillGroup) {
      throw new NotFoundException(
        `SkillGroup with id ${id} not found`,
      );
    }

    return skillGroup;
  }

  async update(
    id: number,
    updateSkillGroupDto: UpdateSkillGroupDto,
  ): Promise<SkillGroup> {
    const skillGroup = await this.skillGroupRepository.findOneBy({
      id,
    });

    if (!skillGroup) {
      throw new NotFoundException(
        `SkillGroup with id ${id} not found`,
      );
    }

    if (Object.keys(updateSkillGroupDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateSkillGroupDto.publicationSkillsId !== undefined) {
      const publicationSkills = await this.publicationSkillsRepository.findOneBy({
        id: updateSkillGroupDto.publicationSkillsId,
      });

      if (!publicationSkills) {
        throw new NotFoundException(
          `PublicationSkills with id ${updateSkillGroupDto.publicationSkillsId} not found`,
        );
      }

      skillGroup.publicationSkills = publicationSkills;
    }

    if (updateSkillGroupDto.skillId !== undefined) {
      const skill = await this.skillRepository.findOneBy({
        id: updateSkillGroupDto.skillId,
      });

      if (!skill) {
        throw new NotFoundException(
          `Skill with id ${updateSkillGroupDto.skillId} not found`,
        );
      }

      skillGroup.skill = skill;
    }

    try {
      return await this.skillGroupRepository.save(skillGroup);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'This Skill is already associated with this PublicationSkills',
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.skillGroupRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `SkillGroup with id ${id} not found`,
      );
    }
  }
}
