import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { Skill } from './entities/skill.entity.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';
import { SkillService } from './skill.service.js';

describe('CreateSkillDto', () => {
  it('allows icon to be omitted', async () => {
    const dto = Object.assign(new CreateSkillDto(), { name: 'TypeScript' });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('allows a nullable icon', async () => {
    const dto = Object.assign(new CreateSkillDto(), {
      name: 'TypeScript',
      icon: null,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts an icon URL or path as a string', async () => {
    const dto = Object.assign(new CreateSkillDto(), {
      name: 'TypeScript',
      icon: '/assets/typescript.svg',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a non-string icon', async () => {
    const dto = Object.assign(new CreateSkillDto(), {
      name: 'TypeScript',
      icon: 42,
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});

describe('SkillService', () => {
  let service: SkillService;
  let skillRepository: {
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
  };
  let skillGroupSkillRepository: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let skillGroupQueryBuilder: {
    select: ReturnType<typeof vi.fn>;
    addSelect: ReturnType<typeof vi.fn>;
    innerJoin: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    getRawMany: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    skillRepository = {
      create: vi.fn((value) => value),
      find: vi.fn(),
      save: vi.fn(),
      findOneBy: vi.fn(),
    };
    skillGroupQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([]),
    };
    skillGroupSkillRepository = {
      createQueryBuilder: vi.fn(() => skillGroupQueryBuilder),
    };
    service = new SkillService(
      skillRepository as unknown as Repository<Skill>,
      skillGroupSkillRepository as unknown as Repository<SkillGroupSkill>,
    );
  });

  it('returns the number of groups using each skill', async () => {
    skillRepository.find.mockResolvedValue([
      { id: 1, name: 'TypeScript', icon: '/assets/typescript.svg' },
      { id: 2, name: 'React', icon: null },
    ]);
    skillGroupQueryBuilder.getRawMany.mockResolvedValue([
      { skillId: 1, count: '3' },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      { id: 1, name: 'TypeScript', icon: '/assets/typescript.svg', inSkillGroups: 3 },
      { id: 2, name: 'React', icon: null, inSkillGroups: 0 },
    ]);
  });

  it('creates a skill with its icon', async () => {
    const skill = {
      id: 1,
      name: 'TypeScript',
      icon: '/assets/typescript.svg',
    };
    skillRepository.save.mockResolvedValue(skill);

    await expect(
      service.create({ name: 'TypeScript', icon: '/assets/typescript.svg' }),
    ).resolves.toBe(skill);
    expect(skillRepository.create).toHaveBeenCalledWith({
      name: 'TypeScript',
      icon: '/assets/typescript.svg',
    });
  });

  it('updates a skill icon', async () => {
    const skill = {
      id: 1,
      name: 'TypeScript',
      icon: null,
    } as Skill;
    skillRepository.findOneBy.mockResolvedValue(skill);
    skillRepository.save.mockResolvedValue(skill);

    await service.update(1, { icon: 'https://example.test/typescript.svg' });

    expect(skill.icon).toBe('https://example.test/typescript.svg');
  });
});