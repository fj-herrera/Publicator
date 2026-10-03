import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconToSkill1792321248114 implements MigrationInterface {
  name = 'AddIconToSkill1792321248114';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "skill" ADD "icon" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "skill" DROP COLUMN "icon"`);
  }
}