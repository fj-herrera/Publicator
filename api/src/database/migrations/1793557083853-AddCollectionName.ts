import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollectionName1793557083853 implements MigrationInterface {
  name = 'AddCollectionName1793557083853';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection" ADD "name" character varying`);
    await queryRunner.query(`UPDATE "collection" SET "name" = 'Collection ' || "id"::text`);
    await queryRunner.query(`ALTER TABLE "collection" ALTER COLUMN "name" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "name"`);
  }
}
