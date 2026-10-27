import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Dimensions } from '../../dimensions/entities/dimensions.entity.js';

@Entity()
export class Asset {
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
        type: 'text',
        nullable: false,
        unique: true,
    })
    url: string;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    name: string | null;

    @Column({
        name: 'mime_type',
        type: 'varchar',
        nullable: true,
    })
    mimeType: string | null;

    @Column({
        name: 'size_bytes',
        type: 'integer',
        nullable: true,
    })
    sizeBytes: number | null;

    @Column({
        name: 'uploaded_at',
        type: 'timestamptz',
        nullable: true,
    })
    uploadedAt: Date | null;

    @ManyToOne(() => Dimensions, {
        nullable: true,
    })
    @JoinColumn({ name: 'dimensions_id' })
    dimensions: Dimensions | null;
}