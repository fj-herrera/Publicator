import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateText1790531799695 implements MigrationInterface {
    name = 'CreateText1790531799695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "text" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "text" text NOT NULL, CONSTRAINT "PK_ef734161ea7c326fedf699309f9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "text"`);
    }

}
