import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../../client/entities/client.entity.js';

@Entity()
export class Meta {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    title: string;

    @Column({
        type: 'varchar',
        unique: true,
        nullable: false,
    })
    slug: string;

    @Column({
        type: 'date',
        nullable: false,
    })
    date: string;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    status: string;

    @ManyToOne(() => Client, {
        nullable: true,
    })
    @JoinColumn({ name: 'client_id' })
    client: Client;

}
