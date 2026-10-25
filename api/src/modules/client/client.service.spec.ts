import { validate } from 'class-validator';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

describe('Client DTOs', () => {
  it('allows the logo to be omitted when creating a client', async () => {
    const dto = Object.assign(new CreateClientDto(), { name: 'Example' });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([
    'https://example.test/logo.svg',
    '/assets/logo.svg',
    null,
  ])('accepts a logo value of %s', async (logo) => {
    const dto = Object.assign(new CreateClientDto(), {
      name: 'Example',
      logo,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a non-string logo', async () => {
    const dto = Object.assign(new CreateClientDto(), {
      name: 'Example',
      logo: 42,
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it('allows the logo to be updated independently', async () => {
    const dto = Object.assign(new UpdateClientDto(), {
      logo: 'https://example.test/logo.svg',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});