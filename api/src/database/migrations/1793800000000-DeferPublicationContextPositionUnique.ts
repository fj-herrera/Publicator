import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeferPublicationContextPositionUnique1793800000000 implements MigrationInterface {
  name = 'DeferPublicationContextPositionUnique1793800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "publication_context" DROP CONSTRAINT "UQ_7a68133931c0e168c37bf55db18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "publication_context" ADD CONSTRAINT "UQ_7a68133931c0e168c37bf55db18" UNIQUE ("context_id", "position") DEFERRABLE INITIALLY DEFERRED`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "publication_context" DROP CONSTRAINT "UQ_7a68133931c0e168c37bf55db18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "publication_context" ADD CONSTRAINT "UQ_7a68133931c0e168c37bf55db18" UNIQUE ("context_id", "position")`,
    );
  }
}
