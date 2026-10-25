import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLogoToClient1792321248116 implements MigrationInterface {
  name = 'AddLogoToClient1792321248116';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client" ADD "logo" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "logo"`);
  }
}