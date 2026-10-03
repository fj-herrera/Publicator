import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { CreateTextDto } from './dto/create-text.dto.js';
import { Text } from './entities/text.entity.js';
import { TextService } from './text.service.js';

describe('CreateTextDto', () => {
  it.each(['PLAIN', 'MD'])('accepts format %s', async (format) => {
    const dto = Object.assign(new CreateTextDto(), {
      text: 'Example text',
      format,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a format outside PLAIN and MD', async () => {
    const dto = Object.assign(new CreateTextDto(), {
      text: 'Example text',
      format: 'HTML',
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it('requires a format', async () => {
    const dto = Object.assign(new CreateTextDto(), { text: 'Example text' });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});

describe('TextService', () => {
  let service: TextService;
  let textRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    textRepository = {
      create: vi.fn((value) => value),
      save: vi.fn(),
      findOneBy: vi.fn(),
    };
    service = new TextService(
      textRepository as unknown as Repository<Text>,
    );
  });

  it('creates text with its format', async () => {
    const text = { id: 1, text: 'Example', format: 'MD' as const };
    textRepository.save.mockResolvedValue(text);

    await expect(
      service.create({ text: 'Example', format: 'MD' }),
    ).resolves.toBe(text);
    expect(textRepository.create).toHaveBeenCalledWith({
      text: 'Example',
      format: 'MD',
    });
  });

  it('updates the format', async () => {
    const text = { id: 1, text: 'Example', format: 'PLAIN' as const } as Text;
    textRepository.findOneBy.mockResolvedValue(text);
    textRepository.save.mockResolvedValue(text);

    await service.update(1, { format: 'MD' });

    expect(text.format).toBe('MD');
  });
});