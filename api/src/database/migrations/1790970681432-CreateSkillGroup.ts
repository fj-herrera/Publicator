import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSkillGroup1790970681432 implements MigrationInterface {
    name = 'CreateSkillGroup1790970681432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skill_group" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "skills_id" integer NOT NULL, "skill_id" integer NOT NULL, CONSTRAINT "PK_7aba2020a477493c6620acebb30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "skill_group" ADD CONSTRAINT "FK_2c396e1413ec8f38ab56b8100b2" FOREIGN KEY ("skills_id") REFERENCES "skills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skill_group" ADD CONSTRAINT "FK_479c59b4cff63d9adb787bc212a" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "skill_group" DROP CONSTRAINT "FK_479c59b4cff63d9adb787bc212a"`);
        await queryRunner.query(`ALTER TABLE "skill_group" DROP CONSTRAINT "FK_2c396e1413ec8f38ab56b8100b2"`);
        await queryRunner.query(`DROP TABLE "skill_group"`);
    }

}
