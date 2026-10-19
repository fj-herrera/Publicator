import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateType1790510404103 implements MigrationInterface {
  name = 'CreateType1790510404103';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "type" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_e23bfe7255ada131861292923fe" UNIQUE ("name"), CONSTRAINT "PK_40410d6bf0bedb43f9cadae6fef" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "type"`);
  }
}
