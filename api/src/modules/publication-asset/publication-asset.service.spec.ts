import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Asset } from '../asset/entities/asset.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { PublicationAsset } from './entities/publication-asset.entity.js';
import { PublicationAssetService } from './publication-asset.service.js';

describe('PublicationAssetService', () => {
  let service: PublicationAssetService;
  let publicationAssetRepository: {
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let publicationRepository: { findOneBy: ReturnType<typeof vi.fn> };
  let assetRepository: { findOneBy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    publicationAssetRepository = {
      create: vi.fn((value) => value),
      find: vi.fn(),
      findOne: vi.fn(),
      findOneBy: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    publicationRepository = { findOneBy: vi.fn() };
    assetRepository = { findOneBy: vi.fn() };

    service = new PublicationAssetService(
      publicationAssetRepository as unknown as Repository<PublicationAsset>,
      publicationRepository as unknown as Repository<Publication>,
      assetRepository as unknown as Repository<Asset>,
    );
  });

  it('creates an association after finding both related records', async () => {
    const publication = { id: 1 } as Publication;
    const asset = { id: 2 } as Asset;
    const association = { id: 3, publication, asset, role: 'THUMBNAIL' };
    publicationRepository.findOneBy.mockResolvedValue(publication);
    assetRepository.findOneBy.mockResolvedValue(asset);
    publicationAssetRepository.save.mockResolvedValue(association);

    await expect(
      service.create({ publicationId: 1, assetId: 2, role: 'THUMBNAIL' }),
    ).resolves.toBe(association);
    expect(publicationAssetRepository.create).toHaveBeenCalledWith({
      publication,
      asset,
      role: 'THUMBNAIL',
    });
  });

  it('rejects creation when the publication does not exist', async () => {
    publicationRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({ publicationId: 1, assetId: 2, role: 'THUMBNAIL' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(assetRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('lists associations with their publication and asset relations', async () => {
    const associations = [{ id: 3 }];
    publicationAssetRepository.find.mockResolvedValue(associations);

    await expect(service.findAll()).resolves.toBe(associations);
    expect(publicationAssetRepository.find).toHaveBeenCalledWith({
      relations: {
        publication: {
          meta: true,
        },
        asset: true,
      },
    });
  });

  it('translates duplicate associations to a conflict', async () => {
    publicationRepository.findOneBy.mockResolvedValue({ id: 1 });
    assetRepository.findOneBy.mockResolvedValue({ id: 2 });
    publicationAssetRepository.save.mockRejectedValue(
      Object.assign(new Error('duplicate'), { code: '23505' }),
    );

    await expect(
      service.create({ publicationId: 1, assetId: 2, role: 'THUMBNAIL' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an empty update', async () => {
    publicationAssetRepository.findOneBy.mockResolvedValue({ id: 3 });

    await expect(service.update(3, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates the role on an existing association', async () => {
    const association = {
      id: 3,
      publication: { id: 1 },
      asset: { id: 2 },
      role: 'THUMBNAIL',
    } as PublicationAsset;
    publicationAssetRepository.findOneBy.mockResolvedValue(association);
    publicationAssetRepository.save.mockResolvedValue(association);

    await expect(service.update(3, { role: 'MAIN_CONTENT' })).resolves.toBe(
      association,
    );
    expect(association.role).toBe('MAIN_CONTENT');
  });

  it('deletes an existing association', async () => {
    publicationAssetRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(3)).resolves.toBeUndefined();
    expect(publicationAssetRepository.delete).toHaveBeenCalledWith(3);
  });

  it('returns not found when deleting a missing association', async () => {
    publicationAssetRepository.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(3)).rejects.toBeInstanceOf(NotFoundException);
  });
});