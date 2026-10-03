import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSkills1790965406695 implements MigrationInterface {
    name = 'CreateSkills1790965406695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skills" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "publication_id" integer NOT NULL, CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "skills" ADD CONSTRAINT "FK_dfeb6149d7ffffa8428bd84976a" FOREIGN KEY ("publication_id") REFERENCES "publication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "skills" DROP CONSTRAINT "FK_dfeb6149d7ffffa8428bd84976a"`);
        await queryRunner.query(`DROP TABLE "skills"`);
    }

}
