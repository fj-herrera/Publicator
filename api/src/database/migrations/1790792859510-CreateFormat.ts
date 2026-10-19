import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFormat1790792859510 implements MigrationInterface {
    name = 'CreateFormat1790792859510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "format" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_4d63df90f21850eff3f5773f16a" UNIQUE ("name"), CONSTRAINT "PK_f9f8ca2f11b7b80bef08cef66fa" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "format"`);
    }

}
