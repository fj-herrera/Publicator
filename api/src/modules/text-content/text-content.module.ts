import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TextContentService } from './text-content.service.js';
import { TextContentController } from './text-content.controller.js';
import { TextContent } from './entities/text-content.entity.js';
import { Content } from '../content/entities/content.entity.js';
import { Text } from '../text/entities/text.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([TextContent, Content, Text])],
  controllers: [TextContentController],
  providers: [TextContentService],
})
export class TextContentModule {}
