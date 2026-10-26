import { MigrationInterface, QueryRunner } from 'typeorm';

type LegacyPublicationSkills = {
  id: number
  publication_id: number
}

type LegacySkillGroupSkill = {
  skill_id: number
}

type InsertedId = {
  id: number
}

type PublicationSkillGroupRow = {
  publication_id: number
  skill_group_id: number
}

export class CreateReusableSkillGroups1792321248117 implements MigrationInterface {
  name = 'CreateReusableSkillGroups1792321248117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "skill_group" RENAME TO "legacy_skill_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "legacy_skill_group" ALTER COLUMN "id" DROP IDENTITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "publication_skills" RENAME TO "legacy_publication_skills"`,
    );

    await queryRunner.query(`
      CREATE TABLE "skill_group" (
        "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        CONSTRAINT "PK_skill_group_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "skill_group_skill" (
        "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
        "skill_group_id" integer NOT NULL,
        "skill_id" integer NOT NULL,
        CONSTRAINT "PK_skill_group_skill_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_skill_group_skill_pair" UNIQUE ("skill_group_id", "skill_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "publication_skill_group" (
        "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
        "publication_id" integer NOT NULL,
        "skill_group_id" integer NOT NULL,
        CONSTRAINT "PK_publication_skill_group_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_publication_skill_group_pair" UNIQUE ("publication_id", "skill_group_id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "skill_group_skill"
      ADD CONSTRAINT "FK_skill_group_skill_group"
      FOREIGN KEY ("skill_group_id") REFERENCES "skill_group"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "skill_group_skill"
      ADD CONSTRAINT "FK_skill_group_skill_skill"
      FOREIGN KEY ("skill_id") REFERENCES "skill"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "publication_skill_group"
      ADD CONSTRAINT "FK_publication_skill_group_publication"
      FOREIGN KEY ("publication_id") REFERENCES "publication"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "publication_skill_group"
      ADD CONSTRAINT "FK_publication_skill_group_skill_group"
      FOREIGN KEY ("skill_group_id") REFERENCES "skill_group"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    const legacyCollections = await queryRunner.query(
      `SELECT "id", "publication_id" FROM "legacy_publication_skills" ORDER BY "id"`,
    ) as LegacyPublicationSkills[];

    for (const collection of legacyCollections) {
      const insertedGroups = await queryRunner.query(
        `INSERT INTO "skill_group" ("name", "description") VALUES ($1, NULL) RETURNING "id"`,
        [`Migrated skill group ${collection.id}`],
      ) as InsertedId[];
      const skillGroupId = Number(insertedGroups[0].id);

      await queryRunner.query(
        `INSERT INTO "publication_skill_group" ("publication_id", "skill_group_id") VALUES ($1, $2)`,
        [collection.publication_id, skillGroupId],
      );

      const legacySkills = await queryRunner.query(
        `SELECT DISTINCT "skill_id" FROM "legacy_skill_group" WHERE "publication_skills_id" = $1 ORDER BY "skill_id"`,
        [collection.id],
      ) as LegacySkillGroupSkill[];

      for (const legacySkill of legacySkills) {
        await queryRunner.query(
          `INSERT INTO "skill_group_skill" ("skill_group_id", "skill_id") VALUES ($1, $2)`,
          [skillGroupId, legacySkill.skill_id],
        );
      }
    }

    await queryRunner.query(`DROP TABLE "legacy_skill_group"`);
    await queryRunner.query(`DROP TABLE "legacy_publication_skills"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "publication_skills" (
        "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
        "publication_id" integer NOT NULL,
        CONSTRAINT "PK_publication_skills_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "skill_group_legacy" (
        "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
        "publication_skills_id" integer NOT NULL,
        "skill_id" integer NOT NULL,
        CONSTRAINT "PK_skill_group_legacy_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "publication_skills"
      ADD CONSTRAINT "FK_publication_skills_publication"
      FOREIGN KEY ("publication_id") REFERENCES "publication"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "skill_group_legacy"
      ADD CONSTRAINT "FK_skill_group_legacy_publication_skills"
      FOREIGN KEY ("publication_skills_id") REFERENCES "publication_skills"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "skill_group_legacy"
      ADD CONSTRAINT "FK_skill_group_legacy_skill"
      FOREIGN KEY ("skill_id") REFERENCES "skill"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    const publicationGroups = await queryRunner.query(
      `SELECT "publication_id", "skill_group_id" FROM "publication_skill_group" ORDER BY "id"`,
    ) as PublicationSkillGroupRow[];

    for (const publicationGroup of publicationGroups) {
      const insertedCollections = await queryRunner.query(
        `INSERT INTO "publication_skills" ("publication_id") VALUES ($1) RETURNING "id"`,
        [publicationGroup.publication_id],
      ) as InsertedId[];
      const publicationSkillsId = Number(insertedCollections[0].id);
      const skillGroupSkills = await queryRunner.query(
        `SELECT "skill_id" FROM "skill_group_skill" WHERE "skill_group_id" = $1 ORDER BY "skill_id"`,
        [publicationGroup.skill_group_id],
      ) as LegacySkillGroupSkill[];

      for (const skillGroupSkill of skillGroupSkills) {
        await queryRunner.query(
          `INSERT INTO "skill_group_legacy" ("publication_skills_id", "skill_id") VALUES ($1, $2)`,
          [publicationSkillsId, skillGroupSkill.skill_id],
        );
      }
    }

    await queryRunner.query(`DROP TABLE "publication_skill_group"`);
    await queryRunner.query(`DROP TABLE "skill_group_skill"`);
    await queryRunner.query(`DROP TABLE "skill_group"`);
    await queryRunner.query(`ALTER TABLE "skill_group_legacy" RENAME TO "skill_group"`);
  }
}