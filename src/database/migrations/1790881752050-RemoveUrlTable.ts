import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUrlTable1760000000000 implements MigrationInterface {
  name = 'RemoveUrlTable1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "url"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "url" (
        "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
        "url" text NOT NULL,
        CONSTRAINT "UQ_url_url" UNIQUE ("url"),
        CONSTRAINT "PK_url" PRIMARY KEY ("id")
      )
    `);
  }
}
