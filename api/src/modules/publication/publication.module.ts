import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationService } from './publication.service.js';
import { PublicationController } from './publication.controller.js';
import { Publication } from './entities/publication.entity.js';
import { Type } from '../type/entities/type.entity.js';
import { Meta } from '../meta/entities/meta.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Publication, Type, Meta])],
  controllers: [PublicationController],
  providers: [PublicationService],
})
export class PublicationModule {}
