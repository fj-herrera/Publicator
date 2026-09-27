import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClient1790527096104 implements MigrationInterface {
    name = 'CreateClient1790527096104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "client" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_480f88a019346eae487a0cd7f0c" UNIQUE ("name"), CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "client"`);
    }

}
