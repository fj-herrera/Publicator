import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Publication } from '../../publication/entities/publication.entity.js';
import { Asset } from '../../asset/entities/asset.entity.js';

@Entity()
@Unique(['publication', 'asset', 'role'])
export class PublicationAsset {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
  })
  id: number;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  role: string;

  @ManyToOne(() => Publication, {
    nullable: false,
  })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @ManyToOne(() => Asset, {
    nullable: false,
  })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;
}