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
import { Skills } from '../../modules/skills/entities/skills.entity.js';
import { Skill } from '../../modules/skill/entities/skill.entity.js';

@Injectable()
export class SkillGroupService {
  constructor(
    @InjectRepository(SkillGroup)
    private readonly skillGroupRepository: Repository<SkillGroup>,

    @InjectRepository(Skills)
    private readonly skillsRepository: Repository<Skills>,

    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(
    createSkillGroupDto: CreateSkillGroupDto,
  ): Promise<SkillGroup> {
    const { skills_id, skill_id } = createSkillGroupDto;

    const skills = await this.skillsRepository.findOneBy({
      id: skills_id,
    });

    if (!skills) {
      throw new NotFoundException(
        `Skills with id ${skills_id} not found`,
      );
    }

    const skill = await this.skillRepository.findOneBy({
      id: skill_id,
    });

    if (!skill) {
      throw new NotFoundException(
        `Skill with id ${skill_id} not found`,
      );
    }

    try {
      const skillGroup = this.skillGroupRepository.create({
        skills,
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
          `Skill ${skill_id} is already associated with Skills ${skills_id}`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<SkillGroup[]> {
    return this.skillGroupRepository.find({
      relations: {
        skills: true,
        skill: true,
      },
    });
  }

  async findOne(id: number): Promise<SkillGroup> {
    const skillGroup = await this.skillGroupRepository.findOne({
      where: { id },
      relations: {
        skills: true,
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

    if (updateSkillGroupDto.skills_id !== undefined) {
      const skills = await this.skillsRepository.findOneBy({
        id: updateSkillGroupDto.skills_id,
      });

      if (!skills) {
        throw new NotFoundException(
          `Skills with id ${updateSkillGroupDto.skills_id} not found`,
        );
      }

      skillGroup.skills = skills;
    }

    if (updateSkillGroupDto.skill_id !== undefined) {
      const skill = await this.skillRepository.findOneBy({
        id: updateSkillGroupDto.skill_id,
      });

      if (!skill) {
        throw new NotFoundException(
          `Skill with id ${updateSkillGroupDto.skill_id} not found`,
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
          'This Skill is already associated with this Skills',
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
