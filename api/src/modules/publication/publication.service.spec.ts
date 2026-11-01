import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Meta } from '../meta/entities/meta.entity.js';
import { Type } from '../type/entities/type.entity.js';
import { AssetCollection } from '../asset-collection/entities/asset-collection.entity.js';
import { Collection } from '../collection/entities/collection.entity.js';
import { Content } from '../content/entities/content.entity.js';
import { PublicationAsset } from '../publication-asset/entities/publication-asset.entity.js';
import { PublicationContext } from '../publication-context/entities/publication-context.entity.js';
import { PublicationSkillGroup } from '../publication-skill-group/entities/publication-skill-group.entity.js';
import { PublicationTag } from '../publication-tag/entities/publication-tag.entity.js';
import { TextContent } from '../text-content/entities/text-content.entity.js';
import { Publication } from './entities/publication.entity.js';
import { PublicationService } from './publication.service.js';

describe('PublicationService.remove', () => {
  let service: PublicationService;
  let calls: string[];
  let deletedFrom: unknown[];
  let failOn: unknown;
  let manager: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    calls = [];
    deletedFrom = [];
    failOn = undefined;

    manager = {
      findOne: vi.fn().mockResolvedValue({ id: 7, meta: { id: 70 } }),
      find: vi.fn(async (entity: unknown) => (
        entity === Content ? [{ id: 40 }, { id: 41 }] : [{ id: 50 }]
      )),
      delete: vi.fn(async (entity: unknown) => {
        if (entity === failOn) throw new Error('boom');
        calls.push(`delete:${(entity as { name: string }).name}`);
      }),
      createQueryBuilder: vi.fn(() => {
        const builder = {
          entity: undefined as unknown,
          delete: vi.fn().mockReturnThis(),
          from: vi.fn((entity: unknown) => {
            builder.entity = entity;
            return builder;
          }),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn(async () => {
            if (builder.entity === failOn) throw new Error('boom');
            deletedFrom.push(builder.entity);
            calls.push(`dependent:${(builder.entity as { name: string }).name}`);
          }),
        };
        return builder;
      }),
      transaction: vi.fn(async (work) => work(manager)),
    };

    service = new PublicationService(
      { manager } as unknown as Repository<Publication>,
      {} as Repository<Type>,
      {} as Repository<Meta>,
    );
  });

  it('removes dependents, then the publication, then its meta, in one transaction', async () => {
    await service.remove(7);

    expect(manager.transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      'dependent:TextContent',
      'dependent:Content',
      'dependent:AssetCollection',
      'dependent:Collection',
      'dependent:PublicationAsset',
      'dependent:PublicationContext',
      'dependent:PublicationSkillGroup',
      'dependent:PublicationTag',
      'delete:Publication',
      'delete:Meta',
    ]);
    expect(manager.delete).toHaveBeenCalledWith(Publication, 7);
    expect(manager.delete).toHaveBeenCalledWith(Meta, 70);
  });

  it('never deletes shared or reusable resources', async () => {
    await service.remove(7);

    expect(deletedFrom).toEqual([
      TextContent,
      Content,
      AssetCollection,
      Collection,
      PublicationAsset,
      PublicationContext,
      PublicationSkillGroup,
      PublicationTag,
    ]);
    const touched = [...deletedFrom, ...manager.delete.mock.calls.map(([e]) => e)];
    expect(touched.map((entity) => (entity as { name: string }).name)).not.toEqual(
      expect.arrayContaining(['Asset', 'Text', 'Tag', 'Context', 'Type', 'Client']),
    );
    expect(touched).not.toContain(Type);
  });

  it('scopes every dependent delete to the publication or its own children', async () => {
    await service.remove(7);

    const wheres = manager.createQueryBuilder.mock.results
      .map((r) => r.value.where.mock.calls[0]);
    expect(wheres).toContainEqual(['content_id IN (:...ids)', { ids: [40, 41] }]);
    expect(wheres).toContainEqual(['collection_id IN (:...ids)', { ids: [50] }]);
    expect(wheres.filter(([sql]) => sql === 'publication_id = :id'))
      .toHaveLength(6);
    wheres
      .filter(([sql]) => sql === 'publication_id = :id')
      .forEach(([, params]) => expect(params).toEqual({ id: 7 }));
  });

  it('skips child deletes when there are no contents or collections', async () => {
    manager.find.mockResolvedValue([]);

    await service.remove(7);

    expect(deletedFrom).not.toContain(TextContent);
    expect(deletedFrom).not.toContain(AssetCollection);
    expect(calls).toContain('delete:Publication');
  });

  it('throws NotFoundException and deletes nothing for a missing publication', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.createQueryBuilder).not.toHaveBeenCalled();
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('propagates a mid-transaction failure so the transaction rolls back', async () => {
    failOn = Collection;

    await expect(service.remove(7)).rejects.toThrow('boom');
    expect(calls).not.toContain('delete:Publication');
    expect(calls).not.toContain('delete:Meta');
  });

  it('does not delete the meta when deleting the publication fails', async () => {
    failOn = Publication;

    await expect(service.remove(7)).rejects.toThrow('boom');
    expect(calls).not.toContain('delete:Meta');
  });
});
