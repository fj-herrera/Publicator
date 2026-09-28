import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
  export class Url {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id: number;

    @Column({
      type: 'text',
      unique: true,
      nullable: false,
    })
    text: string;
}
