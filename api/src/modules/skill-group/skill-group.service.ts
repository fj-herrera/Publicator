import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillGroup } from './entities/skill-group.entity.js';
import { CreateSkillGroupDto } from './dto/create-skill-group.dto.js';
import { UpdateSkillGroupDto } from './dto/update-skill-group.dto.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';
import { PublicationSkillGroup } from '../publication-skill-group/entities/publication-skill-group.entity.js';
import { Skill } from '../../modules/skill/entities/skill.entity.js';

@Injectable()
export class SkillGroupService {
  constructor(
    @InjectRepository(SkillGroup)
    private readonly skillGroupRepository: Repository<SkillGroup>,

    @InjectRepository(SkillGroupSkill)
    private readonly skillGroupSkillRepository: Repository<SkillGroupSkill>,

    @InjectRepository(PublicationSkillGroup)
    private readonly publicationSkillGroupRepository: Repository<PublicationSkillGroup>,
  ) {}

  async create(
    createSkillGroupDto: CreateSkillGroupDto,
  ): Promise<SkillGroup> {
    const skillGroup = this.skillGroupRepository.create({
      name: createSkillGroupDto.name,
      description: createSkillGroupDto.description ?? null,
    });

    return this.skillGroupRepository.save(skillGroup);
  }

  async findAll(): Promise<(SkillGroup & { skills: Skill[]; inPublications: number })[]> {
    const [groups, skillLinks, publicationCounts] = await Promise.all([
      this.skillGroupRepository.find(),
      this.skillGroupSkillRepository.find({
        relations: { skillGroup: true, skill: true },
      }),
      this.publicationSkillGroupRepository
        .createQueryBuilder('publicationSkillGroup')
        .select('skillGroup.id', 'skillGroupId')
        .addSelect('COUNT(publicationSkillGroup.id)', 'count')
        .innerJoin('publicationSkillGroup.skillGroup', 'skillGroup')
        .groupBy('skillGroup.id')
        .getRawMany<{ skillGroupId: number; count: string }>(),
    ])
    const skillsByGroupId = new Map<number, Skill[]>()
    for (const skillLink of skillLinks) {
      const groupSkills = skillsByGroupId.get(skillLink.skillGroup.id) ?? []
      groupSkills.push(skillLink.skill)
      skillsByGroupId.set(skillLink.skillGroup.id, groupSkills)
    }
    const publicationsByGroupId = new Map(
      publicationCounts.map(({ skillGroupId, count }) => [
        Number(skillGroupId),
        Number(count),
      ]),
    )

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      skills: skillsByGroupId.get(group.id) ?? [],
      inPublications: publicationsByGroupId.get(group.id) ?? 0,
    }))
  }

  async findOne(
    id: number,
  ): Promise<SkillGroup & { skills: Skill[]; inPublications: number }> {
    const skillGroup = (await this.findAll()).find((group) => group.id === id)
    if (!skillGroup) {
      throw new NotFoundException(`SkillGroup with id ${id} not found`)
    }
    return skillGroup
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

    if (updateSkillGroupDto.name !== undefined) {
      skillGroup.name = updateSkillGroupDto.name
    }
    if (updateSkillGroupDto.description !== undefined) {
      skillGroup.description = updateSkillGroupDto.description
    }

    return this.skillGroupRepository.save(skillGroup);
  }

  async remove(id: number): Promise<void> {
    const skillGroup = await this.skillGroupRepository.findOneBy({ id });
    if (!skillGroup) {
      throw new NotFoundException(`SkillGroup with id ${id} not found`);
    }

    const publicationAssociation = await this.publicationSkillGroupRepository.findOne({
      where: { skillGroup: { id } },
    });
    if (publicationAssociation) {
      throw new ConflictException(
        'This skill group cannot be deleted while it is used in publications.',
      );
    }

    await this.skillGroupSkillRepository.delete({ skillGroup: { id } });
    const result = await this.skillGroupRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `SkillGroup with id ${id} not found`,
      );
    }
  }
}
