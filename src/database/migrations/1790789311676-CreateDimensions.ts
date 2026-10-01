import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDimensions1790789311676 implements MigrationInterface {
    name = 'CreateDimensions1790789311676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dimensions" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, CONSTRAINT "UQ_94ea97a8db7ef980cd2ee7ebdf4" UNIQUE ("width", "height"), CONSTRAINT "PK_79693265d800ad0830d1ddddb41" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "dimensions"`);
    }

}
