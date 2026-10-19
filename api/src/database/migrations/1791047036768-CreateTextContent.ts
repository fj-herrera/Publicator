import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTextContent1791047036768 implements MigrationInterface {
    name = 'CreateTextContent1791047036768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "text_content" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "type" character varying NOT NULL, "content_id" integer NOT NULL, "text_id" integer, CONSTRAINT "PK_2ea24a6a41875b92fc637400deb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "text_content" ADD CONSTRAINT "FK_c6e3df56251421a1fc665792b6a" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "text_content" ADD CONSTRAINT "FK_964ab18970971823be4607a1d60" FOREIGN KEY ("text_id") REFERENCES "text"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "text_content" DROP CONSTRAINT "FK_964ab18970971823be4607a1d60"`);
        await queryRunner.query(`ALTER TABLE "text_content" DROP CONSTRAINT "FK_c6e3df56251421a1fc665792b6a"`);
        await queryRunner.query(`DROP TABLE "text_content"`);
    }

}
