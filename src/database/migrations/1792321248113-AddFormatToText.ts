import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormatToText1792321248113 implements MigrationInterface {
  name = 'AddFormatToText1792321248113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "text" ADD "format" character varying NOT NULL DEFAULT 'PLAIN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "text" ALTER COLUMN "format" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "text" ADD CONSTRAINT "CHK_text_format" CHECK ("format" IN ('PLAIN', 'MD'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "text" DROP CONSTRAINT "CHK_text_format"`,
    );
    await queryRunner.query(`ALTER TABLE "text" DROP COLUMN "format"`);
  }
}