import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
    export class Text {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id: number;

    @Column({
        type: 'text',
        nullable: false,
    })
    text: string;
}
