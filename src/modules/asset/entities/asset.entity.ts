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

    @ManyToOne(() => Dimensions, {
        nullable: true,
    })
    @JoinColumn({ name: 'dimensions_id' })
    dimensions: Dimensions | null;
}