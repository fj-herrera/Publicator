import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFormatTable1760000000000 implements MigrationInterface {
  name = 'RemoveFormatTable1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "format"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "format" (
        "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "UQ_format_name" UNIQUE ("name"),
        CONSTRAINT "PK_format" PRIMARY KEY ("id")
      )
    `);
  }
}