import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagService } from './tag.service.js';
import { TagController } from './tag.controller.js';
import { Tag } from './entities/tag.entity.js';
import { PublicationTag } from '../publication-tag/entities/publication-tag.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, PublicationTag])],
  controllers: [TagController],
  providers: [TagService],
})
export class TagModule {}
