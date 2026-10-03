import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Skills } from '../../skills/entities/skills.entity.js';
import { Skill } from '../../skill/entities/skill.entity.js';

@Entity()
export class SkillGroup {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @ManyToOne(() => Skills, {
        nullable: false,
    })
    @JoinColumn({ name: 'skills_id' })
    skills: Skills;

    @ManyToOne(() => Skill, {
        nullable: false,
    })
    @JoinColumn({ name: 'skill_id' })
    skill: Skill;
}
