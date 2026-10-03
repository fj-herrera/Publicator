import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';
import { Tag } from '../../tag/entities/tag.entity.js';

@Entity()
@Unique(['publication', 'tag'])
export class PublicationTag {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @ManyToOne(() => Publication, {
        nullable: false,
    })
    @JoinColumn({ name: 'publication_id' })
    publication: Publication;

    @ManyToOne(() => Tag, {
        nullable: false,
    })
    @JoinColumn({ name: 'tag_id' })
    tag: Tag;
}