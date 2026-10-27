import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAssetUploadedAt1793131976007 implements MigrationInterface {
  name = 'AddAssetUploadedAt1793131976007'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "asset" ADD "uploaded_at" TIMESTAMP WITH TIME ZONE')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "asset" DROP COLUMN "uploaded_at"')
  }
}