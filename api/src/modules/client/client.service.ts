import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { MediaStorageService, type StoredFile } from '../media/media-storage.service.js';


@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,

    private readonly mediaStorage: MediaStorageService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    try {
      return await this.clientRepository.manager.transaction(async (manager) => {
        await this.mediaStorage.assertAssignable(createClientDto.logo, 'clients', manager);

        return manager.save(Client, manager.create(Client, createClientDto));
      });
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Client with name "${createClientDto.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<(Client & { inPublications: number })[]> {
    const clients = await this.clientRepository.find();
    const publicationCounts = await this.publicationRepository
      .createQueryBuilder('publication')
      .select('client.id', 'clientId')
      .addSelect('COUNT(publication.id)', 'count')
      .innerJoin('publication.meta', 'meta')
      .innerJoin('meta.client', 'client')
      .groupBy('client.id')
      .getRawMany<{ clientId: number; count: string }>();
    const countsByClientId = new Map(
      publicationCounts.map(({ clientId, count }) => [Number(clientId), Number(count)]),
    );

    return clients.map((client) => ({
      ...client,
      inPublications: countsByClientId.get(client.id) ?? 0,
    }));
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOneBy({ id });

      if (!client) {
        throw new NotFoundException(`Client with id ${id} not found`);
      }

    return client;
  }


  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client> {
    if (Object.keys(updateClientDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const filesToDelete: StoredFile[] = [];

    try {
      const saved = await this.clientRepository.manager.transaction(async (manager) => {
        const client = await manager.findOne(Client, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
          loadEagerRelations: false,
        });

        if (!client) {
          throw new NotFoundException(`Client with id ${id} not found`);
        }

        const previous = client.logo;
        Object.assign(client, updateClientDto);

        if (client.logo !== previous) {
          await this.mediaStorage.assertAssignable(client.logo, 'clients', manager);
        }

        const result = await manager.save(Client, client);

        if (previous && previous !== result.logo) {
          filesToDelete.push({ url: previous, folder: 'clients' });
        }

        return result;
      });

      await this.mediaStorage.deleteUnreferencedFiles(filesToDelete);

      return saved;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          `Client with name "${updateClientDto.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const filesToDelete: StoredFile[] = [];

    await this.clientRepository.manager.transaction(async (manager) => {
      const client = await manager.findOne(Client, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!client) {
        throw new NotFoundException(`Client with id ${id} not found`);
      }

      try {
        await manager.delete(Client, id);
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === '23503'
        ) {
          throw new ConflictException(
            'Client cannot be deleted while it has associations.',
          );
        }

        throw error;
      }

      if (client.logo) {
        filesToDelete.push({ url: client.logo, folder: 'clients' });
      }
    });

    // Runs after COMMIT and never throws: a failed unlink leaves an orphan file, never a broken reference.
    await this.mediaStorage.deleteUnreferencedFiles(filesToDelete);
  }
}
