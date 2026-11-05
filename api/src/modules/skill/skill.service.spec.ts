import { ConflictException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { Skill } from './entities/skill.entity.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';
import { SkillService } from './skill.service.js';
import { MediaStorageService } from '../media/media-storage.service.js';

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
    manager: { transaction: ReturnType<typeof vi.fn> };
  };
  let manager: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mediaStorage: {
    assertAssignable: ReturnType<typeof vi.fn>;
    deleteUnreferencedFiles: ReturnType<typeof vi.fn>;
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
    manager = {
      findOne: vi.fn(),
      create: vi.fn((_entity, value) => ({ ...value })),
      save: vi.fn(async (_entity, value) => value),
      delete: vi.fn(async () => ({ affected: 1 })),
    };
    mediaStorage = {
      assertAssignable: vi.fn().mockResolvedValue(undefined),
      deleteUnreferencedFiles: vi.fn().mockResolvedValue(undefined),
    };
    skillRepository = {
      create: vi.fn((value) => value),
      find: vi.fn(),
      save: vi.fn(),
      findOneBy: vi.fn(),
      manager: { transaction: vi.fn((callback) => callback(manager)) },
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
      mediaStorage as unknown as MediaStorageService,
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

  const dbError = (code: string) => Object.assign(new Error(`pg ${code}`), { code });
  const lockedRead = { lock: { mode: 'pessimistic_write' }, loadEagerRelations: false };

  it('creates a skill with its icon, validating and locking the icon URL first', async () => {
    await expect(
      service.create({ name: 'TypeScript', icon: '/media/skills/ts.svg' }),
    ).resolves.toEqual({ name: 'TypeScript', icon: '/media/skills/ts.svg' });
    expect(mediaStorage.assertAssignable).toHaveBeenCalledWith('/media/skills/ts.svg', 'skills', manager);
    expect(mediaStorage.assertAssignable.mock.invocationCallOrder[0]).toBeLessThan(
      manager.save.mock.invocationCallOrder[0],
    );
  });

  it('reports a duplicate skill name on create', async () => {
    manager.save.mockRejectedValue(dbError('23505'));

    await expect(service.create({ name: 'TypeScript' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('reads and locks the skill row inside the transaction on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: null });

    await service.update(1, { name: 'TypeScript' });

    expect(manager.findOne).toHaveBeenCalledWith(Skill, { where: { id: 1 }, ...lockedRead });
    expect(skillRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('rejects updating a skill that does not exist', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.update(9, { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('reports a duplicate skill name on update without touching files', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'a', icon: '/media/skills/icons/old.svg' });
    manager.save.mockRejectedValue(dbError('23505'));

    await expect(service.update(1, { name: 'b', icon: null })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('removes the previous icon file after commit when the icon is replaced', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/icons/old.svg' });

    await service.update(1, { icon: '/media/skills/new.svg' });

    expect(mediaStorage.assertAssignable).toHaveBeenCalledWith('/media/skills/new.svg', 'skills', manager);
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledExactlyOnceWith([
      { url: '/media/skills/icons/old.svg', folder: 'skills/icons' },
    ]);
  });

  it('removes the icon file after commit when the icon is cleared', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/icons/old.svg' });

    await service.update(1, { icon: null });

    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledWith([
      { url: '/media/skills/icons/old.svg', folder: 'skills/icons' },
    ]);
  });

  it('keeps the icon file when the icon does not change or was null', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 1, name: 'TS', icon: '/media/skills/icons/same.svg' });
    await service.update(1, { name: 'X', icon: '/media/skills/icons/same.svg' });
    manager.findOne.mockResolvedValueOnce({ id: 2, name: 'TS', icon: null });
    await service.update(2, { icon: '/media/skills/new.svg' });

    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenNthCalledWith(1, []);
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenNthCalledWith(2, []);
  });

  it('never deletes the old icon when the COMMIT fails on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/icons/old.svg' });
    skillRepository.manager.transaction.mockImplementation(async (callback) => {
      await callback(manager);
      throw new Error('commit failed');
    });

    await expect(service.update(1, { icon: null })).rejects.toThrow('commit failed');
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('keeps the committed update when file cleanup reports nothing to throw', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/icons/old.svg' });

    await expect(service.update(1, { icon: null })).resolves.toMatchObject({ icon: null });
  });

  it('deletes a skill and then its icon file after commit', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/ts.svg' });

    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(manager.findOne).toHaveBeenCalledWith(Skill, { where: { id: 1 }, ...lockedRead });
    expect(manager.delete).toHaveBeenCalledWith(Skill, 1);
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledExactlyOnceWith([
      { url: '/media/skills/ts.svg', folder: 'skills' },
    ]);
  });

  it('deletes a skill without an icon', async () => {
    manager.findOne.mockResolvedValue({ id: 2, name: 'React', icon: null });

    await expect(service.remove(2)).resolves.toBeUndefined();
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledWith([]);
  });

  it('deletes a skill whose icon is an external URL (cleanup decides what is managed)', async () => {
    manager.findOne.mockResolvedValue({ id: 3, name: 'Vue', icon: 'https://x.test/vue.svg' });

    await expect(service.remove(3)).resolves.toBeUndefined();
  });

  it('rejects deleting a skill that does not exist', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.remove(9)).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('turns a foreign key violation into 409 and keeps the icon file', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/icons/ts.svg' });
    manager.delete.mockRejectedValue(dbError('23503'));

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('propagates other database errors without touching files', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/icons/ts.svg' });
    manager.delete.mockRejectedValue(new Error('boom'));

    await expect(service.remove(1)).rejects.toThrow('boom');
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('never deletes the icon file when the COMMIT fails on remove', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'TS', icon: '/media/skills/icons/ts.svg' });
    skillRepository.manager.transaction.mockImplementation(async (callback) => {
      await callback(manager);
      throw new Error('commit failed');
    });

    await expect(service.remove(1)).rejects.toThrow('commit failed');
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });
  it('does not save the skill when the new file is rejected on create', async () => {
    mediaStorage.assertAssignable.mockRejectedValue(new Error('missing file'));

    await expect(service.create({ name: 'X', icon: '/media/skills/gone.png' })).rejects.toThrow('missing file');
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('does not save the skill or delete the old file when the new file is rejected on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'X', icon: '/media/skills/icons/old.png' });
    mediaStorage.assertAssignable.mockRejectedValue(new Error('missing file'));

    await expect(service.update(1, { icon: '/media/skills/gone.png' })).rejects.toThrow('missing file');
    expect(manager.save).not.toHaveBeenCalled();
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('does not revalidate an unchanged icon on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'X', icon: '/media/skills/icons/same.png' });

    await service.update(1, { name: 'Y' });

    expect(mediaStorage.assertAssignable).not.toHaveBeenCalled();
  });
});
