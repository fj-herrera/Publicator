import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Asset } from '../../asset/entities/asset.entity.js';
import { Text } from '../../text/entities/text.entity.js';

@Entity()
@Unique(['asset', 'text', 'type'])
export class AssetText {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    type: string;

    @ManyToOne(() => Asset, {
        nullable: false,
    })
    @JoinColumn({ name: 'asset_id' })
    asset: Asset;

    @ManyToOne(() => Text, {
        nullable: false,
    })
    @JoinColumn({ name: 'text_id' })
    text: Text;
}
