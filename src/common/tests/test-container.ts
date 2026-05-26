import { Test, TestingModule } from "@nestjs/testing";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Logger } from "@nestjs/common";
import { Role } from "../../domains/identity/role/roles.entity";
import { User } from "../../domains/identity/user/user.entity";

const dbTestConfig = {
  database: "test_db",
  username: "test_user",
  password: "test_pass",
};
interface TestContainerOptions {
  entities: any[];
  providers: any[];
  imports: any[];
}
type TestUserKey = "ADMIN" | "MONITOR" | "STUDY";
export class TestDatabaseManager {
  private container: StartedMySqlContainer;
  private module: TestingModule;
  private host: string;
  private port: number;
  private options: TestContainerOptions;
  private testUsers: Record<TestUserKey, User> = {} as Record<
    TestUserKey,
    User
  >;
  static async create(options: TestContainerOptions) {
    const manager = new TestDatabaseManager();
    manager.options = options;
    await manager.bootContainer();
    await manager.bootModule();
    return manager;
  }

  private async bootContainer() {
    const containerBuilder = new MySqlContainer("mysql:8.0")
      .withDatabase(dbTestConfig.database)
      .withUsername(dbTestConfig.username)
      .withUserPassword(dbTestConfig.password)
      .withExtraHosts([
        { host: "host.docker.internal", ipAddress: "host-gateway" },
      ])
      .withReuse();

    this.container = await containerBuilder.start();

    this.host = this.container.getHost();
    this.port = this.container.getMappedPort(3306);
  }

  private async bootModule() {
    this.module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "mysql",
          host: this.host,
          port: this.port,
          username: dbTestConfig.username,
          password: dbTestConfig.password,
          database: dbTestConfig.database,
          entities: this.options.entities,
          synchronize: true,
          retryAttempts: 2,
          charset: "utf8mb4",
        }),
        TypeOrmModule.forFeature(this.options.entities),
      ],
      providers: [
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        ...this.options.providers,
      ],
    }).compile();
    await this.module.init();
    await this.seedInitialData();
  }
  private async seedInitialData() {
    const dataSource = this.module.get(DataSource);
    const manager = dataSource.manager;
    const testPassword =
      "$2b$01$BvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMvMv";

    await manager.transaction(async (em) => {
      const rolesData: {
        slug: string;
        displayName: TestUserKey;
        description: string;
      }[] = [
        { slug: "nimda", displayName: "ADMIN", description: "Admin total" },
        { slug: "monitor", displayName: "MONITOR", description: "My Monitor" },
        { slug: "study", displayName: "STUDY", description: "Study Monitor" },
      ];

      const roleMap: Record<string, any> = {};

      for (const rData of rolesData) {
        let role = await em.findOne(Role, { where: { slug: rData.slug as any } });
        if (!role) {
          role = em.create(Role, { ...rData, slug: rData.slug as any });
          await em.save(role);
        }
        roleMap[rData.slug] = role;
      }

      const usersData = [
        { username: "admin", email: "admin@test.pt", role: roleMap["nimda"] },
        {
          username: "monitor",
          email: "monitor@test.pt",
          role: roleMap["monitor"],
        },
        { username: "study", email: "study@test.pt", role: roleMap["study"] },
      ];

      for (const userData of usersData) {
        const exists = await em.findOne(User, {
          where: { username: userData.username },
        });
        if (!exists) {
          const user = em.create(User, {
            ...userData,
            password: testPassword,
            fullName: `${userData.username.toUpperCase()} User`,
            ownerRoleId: userData.role.id,
            createdBy: roleMap["nimda"]?.id || 1,
            uniqueHash: `hash_${userData.username}`,
          });
          const savedUser = await em.save(user);
          this.testUsers[userData.role.displayName] = savedUser;
        }
      }
    });

    console.log("🚀 Test Containers: Seed Data Ready", "TestDatabaseManager");
  }

  getTestUser(key: TestUserKey): User {
    return this.testUsers[key];
  }

  getTestUsers(): Record<TestUserKey, User> {
    return this.testUsers;
  }

  getModule() {
    return this.module;
  }

  getContainer() {
    return this.container;
  }

  async cleanup() {
    await this.module?.close();
    await this.container?.stop();
  }

  async resetData() {
    const dataSource = this.module.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0;");
      const entities = dataSource.entityMetadatas;
      for (const entity of entities) {
        await queryRunner.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
      }
      await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1;");
    } finally {
      await queryRunner.release();
    }
  }
}
