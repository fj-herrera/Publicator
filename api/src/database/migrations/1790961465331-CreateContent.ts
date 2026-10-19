import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContent1790961465331 implements MigrationInterface {
    name = 'CreateContent1790961465331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "content" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "publication_id" integer, CONSTRAINT "PK_6a2083913f3647b44f205204e36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "content" ADD CONSTRAINT "FK_ed3038e0209d738f27118d9661c" FOREIGN KEY ("publication_id") REFERENCES "publication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP CONSTRAINT "FK_ed3038e0209d738f27118d9661c"`);
        await queryRunner.query(`DROP TABLE "content"`);
    }

}
