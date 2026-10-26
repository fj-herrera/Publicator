import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SkillGroup {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
