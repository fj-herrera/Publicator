import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
  export class Type {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id: number;

    @Column({
      type: 'varchar',
      unique: true,
      nullable: false,
    })
    name: string;
}
