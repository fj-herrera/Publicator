import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Text } from './entities/text.entity.js';
import { TextService } from './text.service.js';
import { TextController } from './text.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Text])],
  controllers: [TextController],
  providers: [TextService],
})
export class TextModule {}
