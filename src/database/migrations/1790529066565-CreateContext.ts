import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContext1790529066565 implements MigrationInterface {
    name = 'CreateContext1790529066565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "context" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_11fcb6533bd2600f67ec71121e4" UNIQUE ("name"), CONSTRAINT "PK_d1ff50573dd9c6c1d0896805701" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "context"`);
    }

}
