import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';
import { MediaStorageService, type StoredFile } from '../media/media-storage.service.js';


@Injectable()
export class SkillService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,

    @InjectRepository(SkillGroupSkill)
    private readonly skillGroupSkillRepository: Repository<SkillGroupSkill>,

    private readonly mediaStorage: MediaStorageService,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    try {
      return await this.skillRepository.manager.transaction(async (manager) => {
        await this.mediaStorage.assertAssignable(createSkillDto.icon, 'skills/icons', manager);

        return manager.save(Skill, manager.create(Skill, createSkillDto));
      });
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

    const filesToDelete: StoredFile[] = [];

    try {
      const saved = await this.skillRepository.manager.transaction(async (manager) => {
        const skill = await manager.findOne(Skill, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
          loadEagerRelations: false,
        });

        if (!skill) {
          throw new NotFoundException(`Skill with id ${id} not found`);
        }

        const previous = skill.icon;
        Object.assign(skill, updateSkillDto);

        if (skill.icon !== previous) {
          await this.mediaStorage.assertAssignable(skill.icon, 'skills/icons', manager);
        }

        const result = await manager.save(Skill, skill);

        if (previous && previous !== result.icon) {
          filesToDelete.push({ url: previous, folder: 'skills/icons' });
        }

        return result;
      });

      await this.mediaStorage.deleteUnreferencedFiles(filesToDelete);

      return saved;
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
    const filesToDelete: StoredFile[] = [];

    await this.skillRepository.manager.transaction(async (manager) => {
      const skill = await manager.findOne(Skill, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!skill) {
        throw new NotFoundException(`Skill with id ${id} not found`);
      }

      try {
        await manager.delete(Skill, id);
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === '23503'
        ) {
          throw new ConflictException(
            'Skill cannot be deleted while it has associations.',
          );
        }

        throw error;
      }

      if (skill.icon) {
        filesToDelete.push({ url: skill.icon, folder: 'skills/icons' });
      }
    });

    // Runs after COMMIT and never throws: a failed unlink leaves an orphan file, never a broken reference.
    await this.mediaStorage.deleteUnreferencedFiles(filesToDelete);
  }
}
