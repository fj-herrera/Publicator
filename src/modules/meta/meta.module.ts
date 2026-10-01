import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaService } from './meta.service.js';
import { MetaController } from './meta.controller.js';
import { Meta } from './entities/meta.entity.js';
import { Client } from '../client/entities/client.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Meta, Client])],
  controllers: [MetaController],
  providers: [MetaService],
})
export class MetaModule {}
