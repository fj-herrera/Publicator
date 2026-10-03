import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TextFormat = 'PLAIN' | 'MD';

@Entity()
@Check('CHK_text_format', '"format" IN (\'PLAIN\', \'MD\')')
export class Text {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id: number;

    @Column({
        type: 'text',
        nullable: false,
    })
    text: string;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    format: TextFormat;
}
