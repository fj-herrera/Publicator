import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillService } from './skill.service.js';
import { SkillController } from './skill.controller.js';
import { Skill } from './entities/skill.entity.js';
import { SkillGroupSkill } from '../skill-group-skill/entities/skill-group-skill.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, SkillGroupSkill])],
  controllers: [SkillController],
  providers: [SkillService],
})
export class SkillModule {}
