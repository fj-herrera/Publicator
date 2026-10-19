import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationSkillsService } from './publication-skills.service.js';
import { PublicationSkillsController } from './publication-skills.controller.js';
import { PublicationSkills } from './entities/publication-skills.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PublicationSkills, Publication])],
  controllers: [PublicationSkillsController],
  providers: [PublicationSkillsService],
})
export class PublicationSkillsModule {}