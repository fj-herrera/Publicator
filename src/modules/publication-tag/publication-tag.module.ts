import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationTagService } from './publication-tag.service.js';
import { PublicationTagController } from './publication-tag.controller.js';
import { PublicationTag } from './entities/publication-tag.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { Tag } from '../tag/entities/tag.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([PublicationTag, Publication, Tag])],
    controllers: [PublicationTagController],
    providers: [PublicationTagService],
})
export class PublicationTagModule {}
