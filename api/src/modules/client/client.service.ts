import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';


@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    try {
      const client = this.clientRepository.create(createClientDto);

      return await this.clientRepository.save(client);
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

    const client = await this.clientRepository.findOneBy({ id });

    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }

    Object.assign(client, updateClientDto);

    try {
      return await this.clientRepository.save(client);
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
    const result = await this.clientRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
  }
}
