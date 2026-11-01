import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AssetText } from '../asset-text/entities/asset-text.entity.js';
import { Content } from '../content/entities/content.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { Text } from '../text/entities/text.entity.js';
import { TextContent } from './entities/text-content.entity.js';
import { TextContentService } from './text-content.service.js';

describe('TextContentService publication operations', () => {
  let service: TextContentService;
  let manager: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };
  let failAssociationSave: boolean;

  beforeEach(() => {
    failAssociationSave = false;
    manager = {
      findOne: vi.fn(async (entity: unknown) => {
        if (entity === Publication) return { id: 8 };
        if (entity === Content) return { id: 12, publication: { id: 8 } };
        if (entity === TextContent) {
          return {
            id: 21,
            type: 'description',
            content: { id: 12, publication: { id: 8 } },
            text: { id: 31, text: 'Old', format: 'PLAIN' },
          };
        }
        return null;
      }),
      create: vi.fn((_entity, value) => value),
      save: vi.fn(async (entity: unknown, value: Record<string, unknown>) => {
        if (entity === TextContent && failAssociationSave) throw new Error('association failed');
        return { id: entity === Text ? 41 : 21, ...value };
      }),
      count: vi.fn(async (entity: unknown) => (entity === TextContent ? 1 : 0)),
      transaction: vi.fn(async (work) => work(manager)),
    };
    service = new TextContentService(
      { manager } as unknown as Repository<TextContent>,
      {} as Repository<Content>,
      {} as Repository<Text>,
    );
  });

  it('creates Content, Text and TextContent in one transaction', async () => {
    manager.findOne.mockImplementation(async (entity: unknown) => (
      entity === Publication ? { id: 8 } : null
    ));

    const result = await service.createForPublication({
      publicationId: 8,
      type: 'description',
      text: 'Copy',
      format: 'MD',
    });

    expect(manager.transaction).toHaveBeenCalledOnce();
    expect(manager.save).toHaveBeenCalledWith(Content, expect.objectContaining({ publication: { id: 8 } }));
    expect(manager.save).toHaveBeenCalledWith(Text, expect.objectContaining({ text: 'Copy', format: 'MD' }));
    expect(manager.save).toHaveBeenCalledWith(TextContent, expect.objectContaining({ type: 'description' }));
    expect(result.text).toEqual(expect.objectContaining({ text: 'Copy', format: 'MD' }));
  });

  it('rolls back the transaction when creating the association fails', async () => {
    failAssociationSave = true;
    manager.findOne.mockImplementation(async (entity: unknown) => (
      entity === Publication ? { id: 8 } : null
    ));

    await expect(service.createForPublication({
      publicationId: 8,
      type: 'description',
      text: 'Copy',
      format: 'PLAIN',
    })).rejects.toThrow('association failed');
    expect(manager.transaction).toHaveBeenCalledOnce();
  });

  it('does not create Content for a missing Publication', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.createForPublication({
      publicationId: 99,
      type: 'description',
      text: 'Copy',
      format: 'PLAIN',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('copies a shared Text when editing so other associations remain unchanged', async () => {
    manager.count.mockImplementation(async (entity: unknown) => (
      entity === TextContent ? 2 : entity === AssetText ? 1 : 0
    ));

    const result = await service.updateForPublication(21, {
      type: 'summary',
      text: 'Updated copy',
      format: 'MD',
    });

    expect(manager.count).toHaveBeenCalledWith(TextContent, { where: { text: { id: 31 } } });
    expect(manager.count).toHaveBeenCalledWith(AssetText, { where: { text: { id: 31 } } });
    expect(manager.save).toHaveBeenCalledWith(Text, expect.objectContaining({
      text: 'Updated copy',
      format: 'MD',
    }));
    expect(result.text).toEqual(expect.objectContaining({ text: 'Updated copy', format: 'MD' }));
    expect(manager.save.mock.calls.some(([entity, value]) => (
      entity === Text && (value as { id?: number }).id === 31
    ))).toBe(false);
  });
});
