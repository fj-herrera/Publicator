import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Collection } from '../../collection/entities/collection.entity.js';
import { Asset } from '../../asset/entities/asset.entity.js';

@Entity()
@Unique(['collection', 'asset', 'role'])
// Deferred so a reorder can swap positions inside one transaction.
@Unique(['collection', 'position'], { deferrable: 'INITIALLY DEFERRED' })
export class AssetCollection {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    role: string;

    @Column({
        type: 'integer',
        nullable: false,
    })
    position: number;

    @ManyToOne(() => Collection, {
        nullable: false,
    })
    @JoinColumn({ name: 'collection_id' })
    collection: Collection;

    @ManyToOne(() => Asset, {
        nullable: false,
    })
    @JoinColumn({ name: 'asset_id' })
    asset: Asset;
}