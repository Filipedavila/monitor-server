import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Client } from "pg"; 
import { Logger } from "@nestjs/common";
import * as path from "path";

const dbTestConfig = {
  database: "test_db",
  username: "test_user",
  password: "test_pass",
};

interface TestContainerOptions {
  entities: any[];
  providers: any[];
  imports: any[];
  loadSchemma?: boolean;
}

export class TestDatabaseManagerSQL {
  private container: StartedPostgreSqlContainer;
  private module: TestingModule;
  private host: string;
  private port: number;
  private options: TestContainerOptions;

  static async create(options: TestContainerOptions) {
    const manager = new TestDatabaseManagerSQL();
    manager.options = options;
    await manager.bootContainer();
    await manager.bootModule();
    return manager;
  }

  private async bootContainer() {
    const sqlPath = path.resolve(__dirname, "../../../db.sql");

    const containerBuilder = new PostgreSqlContainer("postgres:18-alpine")
      .withDatabase(dbTestConfig.database)
      .withUsername(dbTestConfig.username)
      .withPassword(dbTestConfig.password)
      .withReuse(); // Mantém a aceleração de reutilização de ambiente

    if (this.options.loadSchemma) {
      containerBuilder.withBindMounts([
        {
          source: sqlPath,
          // Ponto de entrada padrão do Postgres para executar DDL na inicialização
          target: "/docker-entrypoint-initdb.d/init.sql",
          mode: "ro",
        },
      ]);
    }

    this.container = await containerBuilder.start();

    // Compatibilidade estrita para WSL2/Localhost
    this.host = "127.0.0.1";
    this.port = this.container.getMappedPort(5432);

    // Substituição da ligação de diagnóstico via driver 'pg'
    const client = new Client({
      host: this.host,
      port: this.port,
      user: dbTestConfig.username,
      password: dbTestConfig.password,
      database: dbTestConfig.database,
      connectionTimeoutMillis: 5000,
    });

    await client.connect();

    try {
      if (this.options.loadSchemma) {
        // Query compatível com o catálogo do Postgres (Information Schema) para validar tabelas do utilizador
        const res = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        `);

        if (!res.rows || res.rows.length === 0) {
          throw new Error("❌ Schema não carregado no PostgreSQL!");
        }
        console.log("✅ PostgreSQL pronto e Schema validado!");
      } else {
        console.log("✅ PostgreSQL pronto (Synchronize mode)!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("❌ Erro na validação do PostgreSQL:", errorMessage);
      throw err;
    } finally {
      await client.end(); // Liberta a socket para evitar leaks de descritores no SO
    }
  }

  private async bootModule() {
    this.module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: this.host,
          port: this.port,
          username: dbTestConfig.username,
          password: dbTestConfig.password,
          database: dbTestConfig.database,
          entities: this.options.entities,
          synchronize: this.options.loadSchemma ? false : true,
          retryAttempts: 2,
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
      const entities = dataSource.entityMetadatas;
      for (const entity of entities) {
        await queryRunner.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      }
    } finally {
      await queryRunner.release();
    }
  }
}