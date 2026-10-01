import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMeta1790886213327 implements MigrationInterface {
    name = 'CreateMeta1790886213327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "meta" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "title" character varying NOT NULL, "slug" character varying NOT NULL, "date" date NOT NULL, "status" character varying NOT NULL, "client_id" integer, CONSTRAINT "UQ_6c9ac9de277b94de4f53e685a0c" UNIQUE ("slug"), CONSTRAINT "PK_c4c17a6c2bd7651338b60fc590b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "meta" ADD CONSTRAINT "FK_4ff1c374215328c2b79022fb864" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP CONSTRAINT "FK_4ff1c374215328c2b79022fb864"`);
        await queryRunner.query(`DROP TABLE "meta"`);
    }

}
