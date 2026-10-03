import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Content } from '../../content/entities/content.entity.js';
import { Text } from '../../text/entities/text.entity.js';

@Entity()
export class TextContent {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    type: string;

    @ManyToOne(() => Content, {
        nullable: false,
    })
    @JoinColumn({ name: 'content_id' })
    content: Content;

    @ManyToOne(() => Text, {
        nullable: true,
    })
    @JoinColumn({ name: 'text_id' })
    text: Text | null;
    }
