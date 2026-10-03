import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';

@Entity()
export class Skills {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @ManyToOne(() => Publication, {
        nullable: false,
    })
    @JoinColumn({ name: 'publication_id' })
    publication: Publication;
}
