import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillGroupService } from './skill-group.service.js';
import { SkillGroupController } from './skill-group.controller.js';
import { SkillGroup } from './entities/skill-group.entity.js';
import { Skill } from '../skill/entities/skill.entity.js';
import { Skills } from '../skills/entities/skills.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([SkillGroup, Skill, Skills])],
    controllers: [SkillGroupController],
    providers: [SkillGroupService],
})
export class SkillGroupModule {}
