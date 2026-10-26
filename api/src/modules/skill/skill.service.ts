import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';


@Injectable()
export class SkillService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,

    @InjectRepository(SkillGroupSkill)
    private readonly skillGroupSkillRepository: Repository<SkillGroupSkill>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    try {
      const skill = this.skillRepository.create(createSkillDto);

      return await this.skillRepository.save(skill);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Skill with name "${createSkillDto.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<(Skill & { inSkillGroups: number })[]> {
    const skills = await this.skillRepository.find();
    const groupCounts = await this.skillGroupSkillRepository
      .createQueryBuilder('skillGroupSkill')
      .select('skill.id', 'skillId')
      .addSelect('COUNT(skillGroupSkill.id)', 'count')
      .innerJoin('skillGroupSkill.skill', 'skill')
      .groupBy('skill.id')
      .getRawMany<{ skillId: number; count: string }>();
    const countsBySkillId = new Map(
      groupCounts.map(({ skillId, count }) => [Number(skillId), Number(count)]),
    );

    return skills.map((skill) => ({
      ...skill,
      inSkillGroups: countsBySkillId.get(skill.id) ?? 0,
    }));
  }

  async findOne(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findOneBy({ id });

      if (!skill) {
        throw new NotFoundException(`Skill with id ${id} not found`);
      }

    return skill;
  }

  async update(id: number, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    if (Object.keys(updateSkillDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const skill = await this.skillRepository.findOneBy({ id });

    if (!skill) {
      throw new NotFoundException(`Skill with id ${id} not found`);
    }

    Object.assign(skill, updateSkillDto);

    try {
      return await this.skillRepository.save(skill);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Skill with name "${updateSkillDto.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.skillRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Skill with id ${id} not found`);
    }
  }
}
