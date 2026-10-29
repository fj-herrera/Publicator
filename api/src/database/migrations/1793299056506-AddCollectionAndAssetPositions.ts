import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollectionAndAssetPositions1793299056506 implements MigrationInterface {
  name = 'AddCollectionAndAssetPositions1793299056506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection" ADD "position" integer`);
    await queryRunner.query(`ALTER TABLE "asset_collection" ADD "position" integer`);

    // Existing rows keep their relative order (by id) as positions 1..n.
    await queryRunner.query(`
      UPDATE "collection" AS c
      SET "position" = ranked.position
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "publication_id" ORDER BY id) AS position
        FROM "collection"
      ) AS ranked
      WHERE c.id = ranked.id
    `);
    await queryRunner.query(`
      UPDATE "asset_collection" AS ac
      SET "position" = ranked.position
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "collection_id" ORDER BY id) AS position
        FROM "asset_collection"
      ) AS ranked
      WHERE ac.id = ranked.id
    `);

    await queryRunner.query(`ALTER TABLE "collection" ALTER COLUMN "position" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_collection" ALTER COLUMN "position" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "collection" ADD CONSTRAINT "UQ_e332d8b2091e283a95d3e5bb6a5" UNIQUE ("publication_id", "position") DEFERRABLE INITIALLY DEFERRED`);
    await queryRunner.query(`ALTER TABLE "asset_collection" ADD CONSTRAINT "UQ_bac858e3396c1cadcab30cb2083" UNIQUE ("collection_id", "position") DEFERRABLE INITIALLY DEFERRED`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_collection" DROP CONSTRAINT "UQ_bac858e3396c1cadcab30cb2083"`);
    await queryRunner.query(`ALTER TABLE "collection" DROP CONSTRAINT "UQ_e332d8b2091e283a95d3e5bb6a5"`);
    await queryRunner.query(`ALTER TABLE "asset_collection" DROP COLUMN "position"`);
    await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "position"`);
  }
}
