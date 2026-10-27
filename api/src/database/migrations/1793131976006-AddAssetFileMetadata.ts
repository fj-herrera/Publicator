import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAssetFileMetadata1793131976006 implements MigrationInterface {
  name = 'AddAssetFileMetadata1793131976006'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "asset" ADD "name" character varying')
    await queryRunner.query('ALTER TABLE "asset" ADD "mime_type" character varying')
    await queryRunner.query('ALTER TABLE "asset" ADD "size_bytes" integer')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "asset" DROP COLUMN "size_bytes"')
    await queryRunner.query('ALTER TABLE "asset" DROP COLUMN "mime_type"')
    await queryRunner.query('ALTER TABLE "asset" DROP COLUMN "name"')
  }
}