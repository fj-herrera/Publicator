import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeUrlToText1790626617140 implements MigrationInterface {
    name = 'ChangeUrlToText1790626617140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "url" RENAME COLUMN "name" TO "text"`);
        await queryRunner.query(`ALTER TABLE "url" RENAME CONSTRAINT "UQ_10bb60a431251bd3cb504dec663" TO "UQ_b38b385e7139759aac1eec2a55c"`);
        await queryRunner.query(`ALTER TABLE "url" DROP CONSTRAINT "UQ_b38b385e7139759aac1eec2a55c"`);
        await queryRunner.query(`ALTER TABLE "url" DROP COLUMN "text"`);
        await queryRunner.query(`ALTER TABLE "url" ADD "text" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "url" ADD CONSTRAINT "UQ_b38b385e7139759aac1eec2a55c" UNIQUE ("text")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "url" DROP CONSTRAINT "UQ_b38b385e7139759aac1eec2a55c"`);
        await queryRunner.query(`ALTER TABLE "url" DROP COLUMN "text"`);
        await queryRunner.query(`ALTER TABLE "url" ADD "text" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "url" ADD CONSTRAINT "UQ_b38b385e7139759aac1eec2a55c" UNIQUE ("text")`);
        await queryRunner.query(`ALTER TABLE "url" RENAME CONSTRAINT "UQ_b38b385e7139759aac1eec2a55c" TO "UQ_10bb60a431251bd3cb504dec663"`);
        await queryRunner.query(`ALTER TABLE "url" RENAME COLUMN "text" TO "name"`);
    }

}
