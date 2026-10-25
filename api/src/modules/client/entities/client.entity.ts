import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Client {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id: number;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    name: string;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    logo: string | null;

}
