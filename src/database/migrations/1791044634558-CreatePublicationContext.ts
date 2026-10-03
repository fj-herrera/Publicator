import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePublicationContext1791044634558 implements MigrationInterface {
    name = 'CreatePublicationContext1791044634558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "publication_context" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "position" integer NOT NULL, "visible" boolean NOT NULL, "featured" boolean NOT NULL, "publication_id" integer NOT NULL, "context_id" integer NOT NULL, CONSTRAINT "UQ_7b9e864834f4076137fcee39ebc" UNIQUE ("publication_id", "context_id"), CONSTRAINT "PK_5e1e09d5d0b58da4b88f38a1405" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "publication_context" ADD CONSTRAINT "FK_4847767bf2d01e38c04d81d43ac" FOREIGN KEY ("publication_id") REFERENCES "publication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publication_context" ADD CONSTRAINT "FK_d4e8f9bcbba5ad7777524cde9f0" FOREIGN KEY ("context_id") REFERENCES "context"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_context" DROP CONSTRAINT "FK_d4e8f9bcbba5ad7777524cde9f0"`);
        await queryRunner.query(`ALTER TABLE "publication_context" DROP CONSTRAINT "FK_4847767bf2d01e38c04d81d43ac"`);
        await queryRunner.query(`DROP TABLE "publication_context"`);
    }

}
