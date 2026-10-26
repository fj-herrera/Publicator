import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillGroupSkill } from './entities/skill-group-skill.entity.js';
import { SkillGroupSkillController } from './skill-group-skill.controller.js';
import { SkillGroupSkillService } from './skill-group-skill.service.js';
import { SkillGroup } from '../skill-group/entities/skill-group.entity.js';
import { Skill } from '../skill/entities/skill.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([SkillGroupSkill, SkillGroup, Skill])],
  controllers: [SkillGroupSkillController],
  providers: [SkillGroupSkillService],
})
export class SkillGroupSkillModule {}