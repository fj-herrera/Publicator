import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Type } from '../../type/entities/type.entity.js';
import { Meta } from '../../meta/entities/meta.entity.js';

@Entity()
export class Publication {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @ManyToOne(() => Type, {
        nullable: false,
    })
    @JoinColumn({ name: 'type_id' })
    type: Type;

    @OneToOne(() => Meta, {
        nullable: false,
    })
    @JoinColumn({ name: 'meta_id' })
    meta: Meta;
}