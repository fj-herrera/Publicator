import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { Skill } from './entities/skill.entity.js';
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
    save: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    skillRepository = {
      create: vi.fn((value) => value),
      save: vi.fn(),
      findOneBy: vi.fn(),
    };
    service = new SkillService(skillRepository as unknown as Repository<Skill>);
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