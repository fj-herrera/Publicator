import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniquePublicationTag1791029583999 implements MigrationInterface {
    name = 'AddUniquePublicationTag1791029583999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_tag" ADD CONSTRAINT "UQ_37b02fdff19489086b49589b4eb" UNIQUE ("publication_id", "tag_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publication_tag" DROP CONSTRAINT "UQ_37b02fdff19489086b49589b4eb"`);
    }

}
