import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationSkillGroup } from './entities/publication-skill-group.entity.js';
import { PublicationSkillGroupController } from './publication-skill-group.controller.js';
import { PublicationSkillGroupService } from './publication-skill-group.service.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { SkillGroup } from '../skill-group/entities/skill-group.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PublicationSkillGroup, Publication, SkillGroup])],
  controllers: [PublicationSkillGroupController],
  providers: [PublicationSkillGroupService],
})
export class PublicationSkillGroupModule {}