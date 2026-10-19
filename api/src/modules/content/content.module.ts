import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';
import { Content } from './entities/content.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Content, Publication])],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
