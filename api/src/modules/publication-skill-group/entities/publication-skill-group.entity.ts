import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';
import { SkillGroup } from '../../skill-group/entities/skill-group.entity.js';

@Entity()
@Unique(['publication', 'skillGroup'])
export class PublicationSkillGroup {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @ManyToOne(() => Publication, { nullable: false })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @ManyToOne(() => SkillGroup, { nullable: false })
  @JoinColumn({ name: 'skill_group_id' })
  skillGroup: SkillGroup;
}