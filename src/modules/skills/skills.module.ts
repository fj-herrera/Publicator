import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from './skills.service.js';
import { SkillsController } from './skills.controller.js';
import { Skills } from './entities/skills.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Skills, Publication])],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
