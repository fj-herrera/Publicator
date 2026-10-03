import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';
import { Context } from '../../context/entities/context.entity.js';

@Entity()
@Unique(['publication', 'context'])
@Unique(['context', 'position'])
export class PublicationContext {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @Column({
        type: 'integer',
        nullable: false,
    })
    position: number;

    @Column({
        type: 'boolean',
        nullable: false,
    })
    visible: boolean;

    @Column({
        type: 'boolean',
        nullable: false,
    })
    featured: boolean;

    @ManyToOne(() => Publication, {
        nullable: false,
    })
    @JoinColumn({ name: 'publication_id' })
    publication: Publication;

    @ManyToOne(() => Context, {
        nullable: false,
    })
    @JoinColumn({ name: 'context_id' })
    context: Context;
}
