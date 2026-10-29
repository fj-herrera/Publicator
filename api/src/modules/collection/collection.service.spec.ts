import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Publication } from '../publication/entities/publication.entity.js';
import { CollectionService } from './collection.service.js';
import { Collection } from './entities/collection.entity.js';

describe('CollectionService', () => {
  let service: CollectionService;
  let manager: {
    transaction: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let deleteAssociations: ReturnType<typeof vi.fn>;
  let collectionRepository: {
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    maximum: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    manager: typeof manager;
  };
  let publicationRepository: { findOneBy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    deleteAssociations = vi.fn().mockResolvedValue(undefined);
    const queryBuilder = {
      delete: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: deleteAssociations,
    };
    manager = {
      transaction: vi.fn(async (work) => work(manager)),
      find: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
      save: vi.fn(async (_entity, value) => value),
      createQueryBuilder: vi.fn(() => queryBuilder),
    };
    collectionRepository = {
      create: vi.fn((value) => value),
      find: vi.fn(),
      findOne: vi.fn(),
      maximum: vi.fn(),
      save: vi.fn(async (value) => value),
      manager,
    };
    publicationRepository = { findOneBy: vi.fn() };

    service = new CollectionService(
      collectionRepository as unknown as Repository<Collection>,
      publicationRepository as unknown as Repository<Publication>,
    );
  });

  it('gives a new collection the next free position in its publication', async () => {
    publicationRepository.findOneBy.mockResolvedValue({ id: 4 });
    collectionRepository.maximum.mockResolvedValue(2);

    const created = await service.create({ type: 'Gallery', publicationId: 4 });

    expect(created.position).toBe(3);
  });

  it('starts at position 1 when the publication has no collections', async () => {
    publicationRepository.findOneBy.mockResolvedValue({ id: 4 });
    collectionRepository.maximum.mockResolvedValue(null);

    const created = await service.create({ type: 'Gallery', publicationId: 4 });

    expect(created.position).toBe(1);
  });

  it('rejects creating a collection for a missing publication', async () => {
    publicationRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({ type: 'Gallery', publicationId: 9 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes only the asset associations, then closes the position gap', async () => {
    collectionRepository.findOne.mockResolvedValue({ id: 5, publication: { id: 4 } });
    manager.find.mockResolvedValue([
      { id: 6, position: 2 },
      { id: 7, position: 3 },
    ]);

    await service.remove(5);

    expect(deleteAssociations).toHaveBeenCalledOnce();
    expect(manager.delete).toHaveBeenCalledWith(Collection, 5);
    expect(manager.update).toHaveBeenCalledWith(Collection, 6, { position: 1 });
    expect(manager.update).toHaveBeenCalledWith(Collection, 7, { position: 2 });
  });

  it('returns not found when removing a missing collection', async () => {
    collectionRepository.findOne.mockResolvedValue(null);

    await expect(service.remove(5)).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it('reorders every collection of the publication in one transaction', async () => {
    publicationRepository.findOneBy.mockResolvedValue({ id: 4 });
    collectionRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await service.reorder({ publicationId: 4, ids: [3, 1, 2] });

    expect(manager.transaction).toHaveBeenCalledOnce();
    expect(manager.update).toHaveBeenCalledWith(Collection, 3, { position: 1 });
    expect(manager.update).toHaveBeenCalledWith(Collection, 1, { position: 2 });
    expect(manager.update).toHaveBeenCalledWith(Collection, 2, { position: 3 });
  });

  it.each([
    ['a missing collection', [1, 2]],
    ['a collection from another publication', [1, 2, 99]],
  ])('rejects a reorder with %s', async (_label, ids) => {
    publicationRepository.findOneBy.mockResolvedValue({ id: 4 });
    collectionRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await expect(
      service.reorder({ publicationId: 4, ids }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it('moves a collection to the end of the new publication and renumbers the old one', async () => {
    const collection = { id: 1, type: 'Gallery', position: 1, publication: { id: 4 } };
    collectionRepository.findOne.mockResolvedValue(collection);
    publicationRepository.findOneBy.mockResolvedValue({ id: 8 });
    collectionRepository.maximum.mockResolvedValue(3);
    manager.find.mockResolvedValue([{ id: 2, position: 2 }]);

    await service.update(1, { publicationId: 8 });

    expect(manager.save).toHaveBeenCalledWith(
      Collection,
      expect.objectContaining({ position: 4, publication: { id: 8 } }),
    );
    expect(manager.update).toHaveBeenCalledWith(Collection, 2, { position: 1 });
  });

  it('keeps the position when only the type changes', async () => {
    const collection = { id: 1, type: 'Gallery', position: 2, publication: { id: 4 } };
    collectionRepository.findOne.mockResolvedValue(collection);

    await service.update(1, { type: 'Slider' });

    expect(manager.save).toHaveBeenCalledWith(
      Collection,
      expect.objectContaining({ type: 'Slider', position: 2 }),
    );
    expect(collectionRepository.maximum).not.toHaveBeenCalled();
  });

  it('rejects an empty update', async () => {
    collectionRepository.findOne.mockResolvedValue({ id: 1, publication: { id: 4 } });

    await expect(service.update(1, {})).rejects.toBeInstanceOf(BadRequestException);
  });
});
