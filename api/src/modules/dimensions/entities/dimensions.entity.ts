import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['width', 'height'])
export class Dimensions {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
  })
  id: number;

  @Column({
    type: 'integer',
    nullable: false,
  })
  width: number;

  @Column({
    type: 'integer',
    nullable: false,
  })
  height: number;
}
