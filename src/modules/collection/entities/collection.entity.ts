import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';

@Entity()
export class Collection {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    type: string;

    @ManyToOne(() => Publication, {
        nullable: false,
    })
    @JoinColumn({ name: 'publication_id' })
    publication: Publication;
}
