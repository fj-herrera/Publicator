import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePublicationTag1791027542692 implements MigrationInterface {
    name = 'CreatePublicationTag1791027542692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "publication_tag" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "publication_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_d4d6153a05bbfc7dcf6a3c9cae2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "publication_tag" ADD CONSTRAINT "FK_49383435ffc3faab115c66d64e6" FOREIGN KEY ("publication_id") REFERENCES "publication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publication_tag" ADD CONSTRAINT "FK_6a7126b8707550756e20c2a516f" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_tag" DROP CONSTRAINT "FK_6a7126b8707550756e20c2a516f"`);
        await queryRunner.query(`ALTER TABLE "publication_tag" DROP CONSTRAINT "FK_49383435ffc3faab115c66d64e6"`);
        await queryRunner.query(`DROP TABLE "publication_tag"`);
    }

}
