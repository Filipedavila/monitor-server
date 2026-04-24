import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class SeedAdminUser2711812345679 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash("admin123", saltRounds);
        const uniqueHash = await bcrypt.hash("admin"+'admin@arte.pt', saltRounds);

        await queryRunner.query(`
            INSERT INTO users (username, email, password, role_id,full_name,created_by_id,unique_hash ) 
            VALUES ('admin', 'admin@arte.pt', ?, 1, 'Admin User', NULL, ?)
            ON DUPLICATE KEY UPDATE 
                password = VALUES(password),
                email = VALUES(email),
                unique_hash = VALUES(unique_hash);
        `, [hashedPassword, uniqueHash]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove o utilizador seed
        await queryRunner.query(`DELETE FROM users WHERE id = 1`);
    }
}