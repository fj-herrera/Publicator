import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Skill } from '../skill/entities/skill.entity.js';
import { SkillGroup } from './entities/skill-group.entity.js';
import { SkillGroupService } from './skill-group.service.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';
import { PublicationSkillGroup } from '../publication-skill-group/entities/publication-skill-group.entity.js';

describe('SkillGroupService', () => {
  let service: SkillGroupService;
  let skillGroupRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let skillGroupSkillRepository: {
    find: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let publicationSkillGroupRepository: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let countQueryBuilder: {
    select: ReturnType<typeof vi.fn>;
    addSelect: ReturnType<typeof vi.fn>;
    innerJoin: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    getRawMany: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    skillGroupRepository = {
      create: vi.fn((value) => value),
      save: vi.fn(),
      find: vi.fn(),
      findOneBy: vi.fn(),
      delete: vi.fn(),
    };
    skillGroupSkillRepository = {
      find: vi.fn(),
      delete: vi.fn(),
    };
    countQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([]),
    };
    publicationSkillGroupRepository = {
      createQueryBuilder: vi.fn(() => countQueryBuilder),
      findOne: vi.fn(),
    };
    service = new SkillGroupService(
      skillGroupRepository as unknown as Repository<SkillGroup>,
      skillGroupSkillRepository as unknown as Repository<SkillGroupSkill>,
      publicationSkillGroupRepository as unknown as Repository<PublicationSkillGroup>,
    );
  });

  it('returns each group with its skills and publication count', async () => {
    const skills = [
      { id: 1, name: 'Photoshop', icon: '/media/skills/icons/photoshop.svg' } as Skill,
    ];
    const groups = [
      { id: 10, name: 'Design', description: 'Design tools' },
      { id: 11, name: 'Development', description: null },
    ];
    skillGroupRepository.find.mockResolvedValue(groups);
    skillGroupSkillRepository.find.mockResolvedValue([
      { skillGroup: { id: 10 }, skill: skills[0] },
    ]);
    countQueryBuilder.getRawMany.mockResolvedValue([
      { skillGroupId: 10, count: '2' },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      { ...groups[0], skills, inPublications: 2 },
      { ...groups[1], skills: [], inPublications: 0 },
    ]);
  });

  it('blocks deletion while a group is assigned to a publication', async () => {
    skillGroupRepository.findOneBy.mockResolvedValue({ id: 10 });
    publicationSkillGroupRepository.findOne.mockResolvedValue({ id: 20 });

    await expect(service.remove(10)).rejects.toBeInstanceOf(ConflictException);
    expect(skillGroupSkillRepository.delete).not.toHaveBeenCalled();
    expect(skillGroupRepository.delete).not.toHaveBeenCalled();
  });

  it('removes the group skill links before deleting an unassigned group', async () => {
    skillGroupRepository.findOneBy.mockResolvedValue({ id: 10 });
    publicationSkillGroupRepository.findOne.mockResolvedValue(null);
    skillGroupRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(10)).resolves.toBeUndefined();
    expect(skillGroupSkillRepository.delete).toHaveBeenCalledWith({
      skillGroup: { id: 10 },
    });
    expect(skillGroupRepository.delete).toHaveBeenCalledWith(10);
  });
});
