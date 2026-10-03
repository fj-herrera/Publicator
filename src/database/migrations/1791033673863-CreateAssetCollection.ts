import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetCollection1791033673863 implements MigrationInterface {
    name = 'CreateAssetCollection1791033673863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "asset_collection" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "role" character varying NOT NULL, "collection_id" integer NOT NULL, "asset_id" integer NOT NULL, CONSTRAINT "UQ_d908566f57022e9b7c1fa0323ae" UNIQUE ("collection_id", "asset_id", "role"), CONSTRAINT "PK_638842a7f249bcba515421e67a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "asset_collection" ADD CONSTRAINT "FK_827a55892e1494a5cc75fc6adb5" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_collection" ADD CONSTRAINT "FK_0e0a904532f7aca1886dcf06e08" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_collection" DROP CONSTRAINT "FK_0e0a904532f7aca1886dcf06e08"`);
        await queryRunner.query(`ALTER TABLE "asset_collection" DROP CONSTRAINT "FK_827a55892e1494a5cc75fc6adb5"`);
        await queryRunner.query(`DROP TABLE "asset_collection"`);
    }

}
