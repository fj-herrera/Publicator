import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePublication1790959222936 implements MigrationInterface {
    name = 'CreatePublication1790959222936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "publication" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "type_id" integer NOT NULL, "meta_id" integer NOT NULL, CONSTRAINT "REL_da9953cb1bf68eaeb0a53f814d" UNIQUE ("meta_id"), CONSTRAINT "PK_8aea8363d5213896a78d8365fab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "publication" ADD CONSTRAINT "FK_7ed367624a5d5eaab7a090a7580" FOREIGN KEY ("type_id") REFERENCES "type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publication" ADD CONSTRAINT "FK_da9953cb1bf68eaeb0a53f814d3" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication" DROP CONSTRAINT "FK_da9953cb1bf68eaeb0a53f814d3"`);
        await queryRunner.query(`ALTER TABLE "publication" DROP CONSTRAINT "FK_7ed367624a5d5eaab7a090a7580"`);
        await queryRunner.query(`DROP TABLE "publication"`);
    }

}
