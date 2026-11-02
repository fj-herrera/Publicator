import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Context } from '../context/entities/context.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { PublicationContext } from './entities/publication-context.entity.js';
import { PublicationContextService } from './publication-context.service.js';

describe('PublicationContextService reorder', () => {
  let service: PublicationContextService;
  let manager: {
    transaction: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let repository: {
    find: ReturnType<typeof vi.fn>;
    manager: typeof manager;
  };
  let contextRepository: { findOneBy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    manager = {
      transaction: vi.fn(async (work) => work(manager)),
      update: vi.fn(),
    };
    repository = { find: vi.fn(), manager };
    contextRepository = { findOneBy: vi.fn().mockResolvedValue({ id: 4 }) };

    service = new PublicationContextService(
      repository as unknown as Repository<PublicationContext>,
      {} as Repository<Publication>,
      contextRepository as unknown as Repository<Context>,
    );
  });

  it('renumbers every relation of the context in one transaction', async () => {
    repository.find.mockResolvedValue([
      { id: 1, position: 1 },
      { id: 2, position: 2 },
      { id: 3, position: 3 },
    ]);

    await service.reorder({ contextId: 4, ids: [3, 1, 2] });

    expect(manager.transaction).toHaveBeenCalledOnce();
    expect(manager.update).toHaveBeenCalledTimes(6);
    expect(manager.update.mock.calls).toEqual([
      [PublicationContext, 3, { position: 4 }],
      [PublicationContext, 1, { position: 5 }],
      [PublicationContext, 2, { position: 6 }],
      [PublicationContext, 3, { position: 1 }],
      [PublicationContext, 1, { position: 2 }],
      [PublicationContext, 2, { position: 3 }],
    ]);
  });

  it.each([
    ['a missing relation', [1, 2]],
    ['a relation from another context', [1, 2, 99]],
  ])('rejects a reorder with %s', async (_label, ids) => {
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await expect(service.reorder({ contextId: 4, ids })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it('rejects an unknown context', async () => {
    contextRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.reorder({ contextId: 9, ids: [1] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
