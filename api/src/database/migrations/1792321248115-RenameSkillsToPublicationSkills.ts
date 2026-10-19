import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSkillsToPublicationSkills1792321248115
  implements MigrationInterface
{
  name = 'RenameSkillsToPublicationSkills1792321248115';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "skills" RENAME TO "publication_skills"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skill_group" RENAME COLUMN "skills_id" TO "publication_skills_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "skill_group" RENAME COLUMN "publication_skills_id" TO "skills_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "publication_skills" RENAME TO "skills"`,
    );
  }
}