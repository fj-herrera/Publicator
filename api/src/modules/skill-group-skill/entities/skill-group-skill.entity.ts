import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SkillGroup } from '../../skill-group/entities/skill-group.entity.js';
import { Skill } from '../../skill/entities/skill.entity.js';

@Entity()
@Unique(['skillGroup', 'skill'])
export class SkillGroupSkill {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @ManyToOne(() => SkillGroup, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_group_id' })
  skillGroup: SkillGroup;

  @ManyToOne(() => Skill, { nullable: false })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;
}