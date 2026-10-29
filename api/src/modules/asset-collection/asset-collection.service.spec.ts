import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Asset } from '../asset/entities/asset.entity.js';
import { Collection } from '../collection/entities/collection.entity.js';
import { AssetCollectionService } from './asset-collection.service.js';
import { AssetCollection } from './entities/asset-collection.entity.js';

describe('AssetCollectionService positions', () => {
  let service: AssetCollectionService;
  let manager: {
    transaction: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let assetCollectionRepository: {
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    maximum: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    manager: typeof manager;
  };
  let collectionRepository: { findOneBy: ReturnType<typeof vi.fn> };
  let assetRepository: { findOneBy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    manager = {
      transaction: vi.fn(async (work) => work(manager)),
      find: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
      save: vi.fn(async (_entity, value) => value),
    };
    assetCollectionRepository = {
      create: vi.fn((value) => value),
      find: vi.fn(),
      findOne: vi.fn(),
      maximum: vi.fn(),
      save: vi.fn(async (value) => value),
      manager,
    };
    collectionRepository = { findOneBy: vi.fn() };
    assetRepository = { findOneBy: vi.fn() };

    service = new AssetCollectionService(
      assetCollectionRepository as unknown as Repository<AssetCollection>,
      collectionRepository as unknown as Repository<Collection>,
      assetRepository as unknown as Repository<Asset>,
    );
  });

  it('puts a new asset at the end of the collection', async () => {
    collectionRepository.findOneBy.mockResolvedValue({ id: 1 });
    assetRepository.findOneBy.mockResolvedValue({ id: 2 });
    assetCollectionRepository.maximum.mockResolvedValue(3);

    const created = await service.create({ collectionId: 1, assetId: 2, role: 'gallery' });

    expect(created.position).toBe(4);
  });

  it('reorders every association of the collection in one transaction', async () => {
    collectionRepository.findOneBy.mockResolvedValue({ id: 1 });
    assetCollectionRepository.find.mockResolvedValue([{ id: 10 }, { id: 11 }, { id: 12 }]);

    await service.reorder({ collectionId: 1, ids: [12, 10, 11] });

    expect(manager.transaction).toHaveBeenCalledOnce();
    expect(manager.update).toHaveBeenCalledWith(AssetCollection, 12, { position: 1 });
    expect(manager.update).toHaveBeenCalledWith(AssetCollection, 10, { position: 2 });
    expect(manager.update).toHaveBeenCalledWith(AssetCollection, 11, { position: 3 });
  });

  it('rejects a reorder that leaves an association out', async () => {
    collectionRepository.findOneBy.mockResolvedValue({ id: 1 });
    assetCollectionRepository.find.mockResolvedValue([{ id: 10 }, { id: 11 }]);

    await expect(
      service.reorder({ collectionId: 1, ids: [10] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it('rejects a reorder for a missing collection', async () => {
    collectionRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.reorder({ collectionId: 1, ids: [10] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes one association and closes the position gap', async () => {
    assetCollectionRepository.findOne.mockResolvedValue({ id: 10, collection: { id: 1 } });
    manager.find.mockResolvedValue([
      { id: 11, position: 2 },
      { id: 12, position: 3 },
    ]);

    await service.remove(10);

    expect(manager.delete).toHaveBeenCalledWith(AssetCollection, 10);
    expect(manager.update).toHaveBeenCalledWith(AssetCollection, 11, { position: 1 });
    expect(manager.update).toHaveBeenCalledWith(AssetCollection, 12, { position: 2 });
  });

  it('returns not found when removing a missing association', async () => {
    assetCollectionRepository.findOne.mockResolvedValue(null);

    await expect(service.remove(10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps the position when only the role changes', async () => {
    assetCollectionRepository.findOne.mockResolvedValue({
      id: 10, role: 'gallery', position: 2, collection: { id: 1 },
    });

    await service.update(10, { role: 'cover' });

    expect(manager.save).toHaveBeenCalledWith(
      AssetCollection,
      expect.objectContaining({ role: 'cover', position: 2 }),
    );
    expect(assetCollectionRepository.maximum).not.toHaveBeenCalled();
  });
});
