import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillGroupSkill } from './entities/skill-group-skill.entity.js';
import { CreateSkillGroupSkillDto } from './dto/create-skill-group-skill.dto.js';
import { UpdateSkillGroupSkillDto } from './dto/update-skill-group-skill.dto.js';
import { SkillGroup } from '../skill-group/entities/skill-group.entity.js';
import { Skill } from '../skill/entities/skill.entity.js';

@Injectable()
export class SkillGroupSkillService {
  constructor(
    @InjectRepository(SkillGroupSkill)
    private readonly skillGroupSkillRepository: Repository<SkillGroupSkill>,
    @InjectRepository(SkillGroup)
    private readonly skillGroupRepository: Repository<SkillGroup>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateSkillGroupSkillDto): Promise<SkillGroupSkill> {
    const skillGroup = await this.skillGroupRepository.findOneBy({ id: dto.skillGroupId })
    if (!skillGroup) {
      throw new NotFoundException(`SkillGroup with id ${dto.skillGroupId} not found`)
    }

    const skill = await this.skillRepository.findOneBy({ id: dto.skillId })
    if (!skill) {
      throw new NotFoundException(`Skill with id ${dto.skillId} not found`)
    }

    try {
      return await this.skillGroupSkillRepository.save(
        this.skillGroupSkillRepository.create({ skillGroup, skill }),
      )
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException('This skill already belongs to this group.')
      }
      throw error
    }
  }

  async findAll(): Promise<SkillGroupSkill[]> {
    return this.skillGroupSkillRepository.find({
      relations: { skillGroup: true, skill: true },
    })
  }

  async findOne(id: number): Promise<SkillGroupSkill> {
    const relation = await this.skillGroupSkillRepository.findOne({
      where: { id },
      relations: { skillGroup: true, skill: true },
    })
    if (!relation) {
      throw new NotFoundException(`SkillGroupSkill with id ${id} not found`)
    }
    return relation
  }

  async update(id: number, dto: UpdateSkillGroupSkillDto): Promise<SkillGroupSkill> {
    const relation = await this.skillGroupSkillRepository.findOneBy({ id })
    if (!relation) {
      throw new NotFoundException(`SkillGroupSkill with id ${id} not found`)
    }
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No fields to update')
    }

    if (dto.skillGroupId !== undefined) {
      const skillGroup = await this.skillGroupRepository.findOneBy({ id: dto.skillGroupId })
      if (!skillGroup) {
        throw new NotFoundException(`SkillGroup with id ${dto.skillGroupId} not found`)
      }
      relation.skillGroup = skillGroup
    }
    if (dto.skillId !== undefined) {
      const skill = await this.skillRepository.findOneBy({ id: dto.skillId })
      if (!skill) {
        throw new NotFoundException(`Skill with id ${dto.skillId} not found`)
      }
      relation.skill = skill
    }

    try {
      return await this.skillGroupSkillRepository.save(relation)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException('This skill already belongs to this group.')
      }
      throw error
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.skillGroupSkillRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException(`SkillGroupSkill with id ${id} not found`)
    }
  }
}