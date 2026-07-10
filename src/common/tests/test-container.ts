import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
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
  private container: StartedPostgreSqlContainer;
  private module: TestingModule;
  private host: string;
  private port: number;
  private options: TestContainerOptions;
  private testUsers: Record<TestUserKey, User> = {} as Record<TestUserKey, User>;

  static async create(options: TestContainerOptions) {
    const manager = new TestDatabaseManager();
    manager.options = options;
    await manager.bootContainer();
    await manager.bootModule();
    return manager;
  }

  private async bootContainer() {
    // Alvo para Postgres 18 baseado em Alpine Linux conforme pedido
    const containerBuilder = new PostgreSqlContainer("postgres:18-alpine")
      .withDatabase(dbTestConfig.database)
      .withUsername(dbTestConfig.username)
      .withPassword(dbTestConfig.password)
      .withExtraHosts([
        { host: "host.docker.internal", ipAddress: "host-gateway" },
      ])
      .withReuse();

    this.container = await containerBuilder.start();

    this.host = this.container.getHost();
    this.port = this.container.getMappedPort(5432); // Porta padrão do Postgres
  }

  private async bootModule() {
    this.module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres", // Alterado para o driver pg
          host: this.host,
          port: this.port,
          username: dbTestConfig.username,
          password: dbTestConfig.password,
          database: dbTestConfig.database,
          entities: this.options.entities,
          synchronize: true, // Garante a criação de DDL no contentor efémero
          retryAttempts: 2,
          // O Postgres assume UTF8 nativamente, removeu-se a propriedade 'charset' incompatível
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
      // No PostgreSQL não existe SET FOREIGN_KEY_CHECKS.
      // A abordagem correta e de alta performance é usar TRUNCATE TABLE ... CASCADE.
      const entities = dataSource.entityMetadatas;
      for (const entity of entities) {
        // Aspas duplas para identificadores em Postgres e CASCADE para limpar tabelas dependentes
        await queryRunner.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      }
    } finally {
      await queryRunner.release();
    }
  }
}