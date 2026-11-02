import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity.js';
import { ClientService } from './client.service.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { MediaStorageService } from '../media/media-storage.service.js';

describe('ClientService logo files', () => {
  let service: ClientService;
  let clientRepository: { manager: { transaction: ReturnType<typeof vi.fn> } };
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

  const dbError = (code: string) => Object.assign(new Error(`pg ${code}`), { code });
  const lockedRead = { lock: { mode: 'pessimistic_write' }, loadEagerRelations: false };
  const failCommit = () =>
    clientRepository.manager.transaction.mockImplementation(async (callback) => {
      await callback(manager);
      throw new Error('commit failed');
    });

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
    clientRepository = {
      manager: { transaction: vi.fn((callback) => callback(manager)) },
    };
    service = new ClientService(
      clientRepository as unknown as Repository<Client>,
      {} as Repository<Publication>,
      mediaStorage as unknown as MediaStorageService,
    );
  });

  it('creates a client validating and locking the logo URL before writing', async () => {
    await expect(
      service.create({ name: 'Acme', logo: '/media/clients/acme.png' }),
    ).resolves.toEqual({ name: 'Acme', logo: '/media/clients/acme.png' });
    expect(mediaStorage.assertAssignable).toHaveBeenCalledWith('/media/clients/acme.png', 'clients', manager);
    expect(mediaStorage.assertAssignable.mock.invocationCallOrder[0]).toBeLessThan(
      manager.save.mock.invocationCallOrder[0],
    );
  });

  it('reports a duplicate client name on create', async () => {
    manager.save.mockRejectedValue(dbError('23505'));

    await expect(service.create({ name: 'Acme' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('reads and locks the client row inside the transaction on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'Acme', logo: null });

    await service.update(1, { name: 'Acme Inc' });

    expect(manager.findOne).toHaveBeenCalledWith(Client, { where: { id: 1 }, ...lockedRead });
  });

  it('rejects updating a client that does not exist', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.update(9, { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('reports a duplicate client name on update without touching files', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'a', logo: '/media/clients/old.png' });
    manager.save.mockRejectedValue(dbError('23505'));

    await expect(service.update(1, { name: 'b', logo: null })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('removes the previous logo after commit when the logo is replaced', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'Acme', logo: '/media/clients/old.png' });

    await service.update(1, { logo: '/media/clients/new.png' });

    expect(mediaStorage.assertAssignable).toHaveBeenCalledWith('/media/clients/new.png', 'clients', manager);
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledExactlyOnceWith([
      { url: '/media/clients/old.png', folder: 'clients' },
    ]);
  });

  it('removes the logo after commit when the logo is cleared', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'Acme', logo: '/media/clients/old.png' });

    await service.update(1, { logo: null });

    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledWith([
      { url: '/media/clients/old.png', folder: 'clients' },
    ]);
  });

  it('keeps the logo when it does not change or the client had none', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 1, name: 'Acme', logo: '/media/clients/same.png' });
    await service.update(1, { name: 'Acme Inc' });
    manager.findOne.mockResolvedValueOnce({ id: 2, name: 'Acme', logo: null });
    await service.update(2, { logo: '/media/clients/new.png' });

    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenNthCalledWith(1, []);
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenNthCalledWith(2, []);
  });

  it('never deletes the old logo when the COMMIT fails on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'Acme', logo: '/media/clients/old.png' });
    failCommit();

    await expect(service.update(1, { logo: null })).rejects.toThrow('commit failed');
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('deletes a client and then its logo file after commit', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'Acme', logo: '/media/clients/acme.png' });

    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(manager.findOne).toHaveBeenCalledWith(Client, { where: { id: 1 }, ...lockedRead });
    expect(manager.delete).toHaveBeenCalledWith(Client, 1);
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledExactlyOnceWith([
      { url: '/media/clients/acme.png', folder: 'clients' },
    ]);
  });

  it('deletes a client without a logo', async () => {
    manager.findOne.mockResolvedValue({ id: 2, name: 'Acme', logo: null });

    await expect(service.remove(2)).resolves.toBeUndefined();
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledWith([]);
  });

  it('rejects deleting a client that does not exist', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.remove(9)).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('turns a foreign key violation into 409 and keeps the logo file', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'Acme', logo: '/media/clients/acme.png' });
    manager.delete.mockRejectedValue(dbError('23503'));

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('never deletes the logo file when the COMMIT fails on remove', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'Acme', logo: '/media/clients/acme.png' });
    failCommit();

    await expect(service.remove(1)).rejects.toThrow('commit failed');
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });
  it('does not save the client when the new file is rejected on create', async () => {
    mediaStorage.assertAssignable.mockRejectedValue(new Error('missing file'));

    await expect(service.create({ name: 'X', logo: '/media/clients/gone.png' })).rejects.toThrow('missing file');
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('does not save the client or delete the old file when the new file is rejected on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'X', logo: '/media/clients/old.png' });
    mediaStorage.assertAssignable.mockRejectedValue(new Error('missing file'));

    await expect(service.update(1, { logo: '/media/clients/gone.png' })).rejects.toThrow('missing file');
    expect(manager.save).not.toHaveBeenCalled();
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled();
  });

  it('does not revalidate an unchanged logo on update', async () => {
    manager.findOne.mockResolvedValue({ id: 1, name: 'X', logo: '/media/clients/same.png' });

    await service.update(1, { name: 'Y' });

    expect(mediaStorage.assertAssignable).not.toHaveBeenCalled();
  });
});
