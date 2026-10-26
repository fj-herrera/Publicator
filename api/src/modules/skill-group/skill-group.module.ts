import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillGroupService } from './skill-group.service.js';
import { SkillGroupController } from './skill-group.controller.js';
import { SkillGroup } from './entities/skill-group.entity.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';
import { PublicationSkillGroup } from '../publication-skill-group/entities/publication-skill-group.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([SkillGroup, SkillGroupSkill, PublicationSkillGroup])],
    controllers: [SkillGroupController],
    providers: [SkillGroupService],
})
export class SkillGroupModule {}
