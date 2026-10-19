import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';

@Entity()
export class Content {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @ManyToOne(() => Publication, {
        nullable: true,
    })
    @JoinColumn({ name: 'publication_id' })
    publication: Publication;
}
