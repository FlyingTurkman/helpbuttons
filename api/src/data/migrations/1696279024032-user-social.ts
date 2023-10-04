import { MigrationInterface, QueryRunner } from "typeorm";

export class UserSocial1696279024032 implements MigrationInterface {
    name = 'UserSocial1696279024032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_following_user" ("userId_1" character(36) NOT NULL, "userId_2" character(36) NOT NULL, CONSTRAINT "PK_2c183a6c043a59133b516d5daa9" PRIMARY KEY ("userId_1", "userId_2"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9691163a986dfb589a90dea3d5" ON "user_following_user" ("userId_1") `);
        await queryRunner.query(`CREATE INDEX "IDX_a89f5a432c1edcd03a3b655532" ON "user_following_user" ("userId_2") `);
        await queryRunner.query(`ALTER TABLE "user_following_user" ADD CONSTRAINT "FK_9691163a986dfb589a90dea3d5f" FOREIGN KEY ("userId_1") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_following_user" ADD CONSTRAINT "FK_a89f5a432c1edcd03a3b6555321" FOREIGN KEY ("userId_2") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_following_user" DROP CONSTRAINT "FK_a89f5a432c1edcd03a3b6555321"`);
        await queryRunner.query(`ALTER TABLE "user_following_user" DROP CONSTRAINT "FK_9691163a986dfb589a90dea3d5f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a89f5a432c1edcd03a3b655532"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9691163a986dfb589a90dea3d5"`);
        await queryRunner.query(`DROP TABLE "user_following_user"`);
    }

}
