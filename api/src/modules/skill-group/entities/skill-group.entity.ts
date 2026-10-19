import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicationSkills } from '../../publication-skills/entities/publication-skills.entity.js';
import { Skill } from '../../skill/entities/skill.entity.js';

@Entity()
export class SkillGroup {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @ManyToOne(() => PublicationSkills, {
        nullable: false,
    })
    @JoinColumn({ name: 'publication_skills_id' })
    publicationSkills: PublicationSkills;

    @ManyToOne(() => Skill, {
        nullable: false,
    })
    @JoinColumn({ name: 'skill_id' })
    skill: Skill;
}
