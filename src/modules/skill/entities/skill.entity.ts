import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Skill {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id: number;

    @Column({
        type: 'varchar',
        unique: true,
        nullable: false,
    })
    name: string;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    icon: string | null;
}

