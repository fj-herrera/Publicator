import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCollection1790964003227 implements MigrationInterface {
    name = 'CreateCollection1790964003227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "collection" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "type" character varying NOT NULL, "publication_id" integer NOT NULL, CONSTRAINT "PK_ad3f485bbc99d875491f44d7c85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "collection" ADD CONSTRAINT "FK_07816008fed30de147310b18807" FOREIGN KEY ("publication_id") REFERENCES "publication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collection" DROP CONSTRAINT "FK_07816008fed30de147310b18807"`);
        await queryRunner.query(`DROP TABLE "collection"`);
    }

}
