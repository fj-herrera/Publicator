import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAsset1791030510294 implements MigrationInterface {
    name = 'CreateAsset1791030510294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "asset" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "type" character varying NOT NULL, "url" text NOT NULL, "dimensions_id" integer, CONSTRAINT "UQ_35c6eae153a827100bc8d7731cb" UNIQUE ("url"), CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "asset" ADD CONSTRAINT "FK_6c119e237f064c043e9f62d15d9" FOREIGN KEY ("dimensions_id") REFERENCES "dimensions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset" DROP CONSTRAINT "FK_6c119e237f064c043e9f62d15d9"`);
        await queryRunner.query(`DROP TABLE "asset"`);
    }

}
