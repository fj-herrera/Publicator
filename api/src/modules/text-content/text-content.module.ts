import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TextContentService } from './text-content.service.js';
import { TextContentController } from './text-content.controller.js';
import { TextContent } from './entities/text-content.entity.js';
import { Content } from '../content/entities/content.entity.js';
import { Text } from '../text/entities/text.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { AssetText } from '../asset-text/entities/asset-text.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([TextContent, Content, Text, Publication, AssetText])],
  controllers: [TextContentController],
  providers: [TextContentService],
})
export class TextContentModule {}
