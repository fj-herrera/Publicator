import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetText1791037105257 implements MigrationInterface {
    name = 'CreateAssetText1791037105257'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "asset_text" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "type" character varying NOT NULL, "asset_id" integer NOT NULL, "text_id" integer NOT NULL, CONSTRAINT "UQ_5e1259167e1ba7eeb66f80adf95" UNIQUE ("asset_id", "text_id", "type"), CONSTRAINT "PK_94d7841bdb7a205a7312b50843d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "asset_text" ADD CONSTRAINT "FK_c8ce809dadf1402b52394dc6cc3" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_text" ADD CONSTRAINT "FK_c015bfe24d5fb5bc5265657005c" FOREIGN KEY ("text_id") REFERENCES "text"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_text" DROP CONSTRAINT "FK_c015bfe24d5fb5bc5265657005c"`);
        await queryRunner.query(`ALTER TABLE "asset_text" DROP CONSTRAINT "FK_c8ce809dadf1402b52394dc6cc3"`);
        await queryRunner.query(`DROP TABLE "asset_text"`);
    }

}
