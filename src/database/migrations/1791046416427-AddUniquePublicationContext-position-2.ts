import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniquePublicationContextPosition21791046416427 implements MigrationInterface {
    name = 'AddUniquePublicationContextPosition21791046416427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_context" DROP CONSTRAINT "UQ_d8fa7c37467330c7c91a83c5e0f"`);
        await queryRunner.query(`ALTER TABLE "publication_context" ADD CONSTRAINT "UQ_7a68133931c0e168c37bf55db18" UNIQUE ("context_id", "position")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_context" DROP CONSTRAINT "UQ_7a68133931c0e168c37bf55db18"`);
        await queryRunner.query(`ALTER TABLE "publication_context" ADD CONSTRAINT "UQ_d8fa7c37467330c7c91a83c5e0f" UNIQUE ("position", "publication_id")`);
    }

}
