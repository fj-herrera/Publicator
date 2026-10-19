import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniquePublicationContextPosition1791045888013 implements MigrationInterface {
    name = 'AddUniquePublicationContextPosition1791045888013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_context" ADD CONSTRAINT "UQ_d8fa7c37467330c7c91a83c5e0f" UNIQUE ("publication_id", "position")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_context" DROP CONSTRAINT "UQ_d8fa7c37467330c7c91a83c5e0f"`);
    }

}
