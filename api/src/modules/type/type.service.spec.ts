import { Repository } from 'typeorm';
import { Publication } from '../publication/entities/publication.entity.js';
import { Type } from './entities/type.entity.js';
import { TypeService } from './type.service.js';

describe('TypeService', () => {
  let service: TypeService;
  let typeRepository: { find: ReturnType<typeof vi.fn> };
  let publicationRepository: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let publicationQuery: {
    select: ReturnType<typeof vi.fn>;
    addSelect: ReturnType<typeof vi.fn>;
    innerJoin: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    getRawMany: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    typeRepository = { find: vi.fn() };
    publicationQuery = {
      select: vi.fn(),
      addSelect: vi.fn(),
      innerJoin: vi.fn(),
      groupBy: vi.fn(),
      getRawMany: vi.fn(),
    };
    publicationQuery.select.mockReturnValue(publicationQuery);
    publicationQuery.addSelect.mockReturnValue(publicationQuery);
    publicationQuery.innerJoin.mockReturnValue(publicationQuery);
    publicationQuery.groupBy.mockReturnValue(publicationQuery);
    publicationRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(publicationQuery),
    };

    service = new TypeService(
      typeRepository as unknown as Repository<Type>,
      publicationRepository as unknown as Repository<Publication>,
    );
  });

  it('returns each type with its publication count', async () => {
    typeRepository.find.mockResolvedValue([
      { id: 1, name: 'Design' },
      { id: 2, name: 'Development' },
    ]);
    publicationQuery.getRawMany.mockResolvedValue([
      { typeId: '1', count: '3' },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      { id: 1, name: 'Design', inPublications: 3 },
      { id: 2, name: 'Development', inPublications: 0 },
    ]);
    expect(publicationQuery.innerJoin).toHaveBeenCalledWith(
      'publication.type',
      'type',
    );
    expect(publicationQuery.groupBy).toHaveBeenCalledWith('type.id');
  });
});