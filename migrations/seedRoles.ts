import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedRoles2711812345678 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
            INSERT INTO roles ( display_name, slug, description) VALUES 
            ( 'ADMIN', 'nimda', 'Administrador total do sistema'),
            ('MONITOR', 'monitor', 'Acesso ao My Monitor'),
            ('STUDY', 'study', 'Acesso ao Study Monitor');`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM roles WHERE slug IN ('nimda', 'monitor', 'study')`);
    }
}