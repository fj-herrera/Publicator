import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionService } from './collection.service.js';
import { CollectionController } from './collection.controller.js';
import { Collection } from './entities/collection.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, Publication])],
  controllers: [CollectionController],
  providers: [CollectionService],
})
export class CollectionModule {}
