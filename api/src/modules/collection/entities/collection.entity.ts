import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Column,
    Unique,
} from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';

// Deferred so a reorder can swap positions inside one transaction.
@Unique(['publication', 'position'], { deferrable: 'INITIALLY DEFERRED' })
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

    @Column({
        type: 'integer',
        nullable: false,
    })
    position: number;

    @ManyToOne(() => Publication, {
        nullable: false,
    })
    @JoinColumn({ name: 'publication_id' })
    publication: Publication;
}
