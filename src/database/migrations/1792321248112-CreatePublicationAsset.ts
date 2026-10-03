import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePublicationAsset1792321248112
  implements MigrationInterface
{
  name = 'CreatePublicationAsset1792321248112';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "publication_asset" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "publication_id" integer NOT NULL, "asset_id" integer NOT NULL, "role" character varying NOT NULL, CONSTRAINT "UQ_publication_asset_publication_asset_role" UNIQUE ("publication_id", "asset_id", "role"), CONSTRAINT "PK_publication_asset" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "publication_asset" ADD CONSTRAINT "FK_publication_asset_publication" FOREIGN KEY ("publication_id") REFERENCES "publication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "publication_asset" ADD CONSTRAINT "FK_publication_asset_asset" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "publication_asset" DROP CONSTRAINT "FK_publication_asset_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "publication_asset" DROP CONSTRAINT "FK_publication_asset_publication"`,
    );
    await queryRunner.query(`DROP TABLE "publication_asset"`);
  }
}