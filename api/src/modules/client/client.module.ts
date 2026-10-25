import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { ClientService } from './client.service.js';
import { ClientController } from './client.controller.js';

@Module({
  controllers: [ClientController],
  providers: [ClientService],
  imports: [TypeOrmModule.forFeature([Client, Publication])],
})
export class ClientModule {}
