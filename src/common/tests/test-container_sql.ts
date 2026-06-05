import { Test, TestingModule } from "@nestjs/testing";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import * as mysql from "mysql2/promise";
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
  private container: StartedMySqlContainer;
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

    const containerBuilder = new MySqlContainer("mysql:8.0")
      .withDatabase(dbTestConfig.database)
      .withUsername(dbTestConfig.username)
      .withUserPassword(dbTestConfig.password)
      .withReuse() // Força o reuse sempre para ganhar velocidade
      .withCommand([
        "--character-set-server=utf8mb4",
        "--collation-server=utf8mb4_unicode_ci",
        "--default-authentication-plugin=mysql_native_password",
      ]);

    if (this.options.loadSchemma) {
      containerBuilder.withBindMounts([
        {
          source: sqlPath,
          target: "/docker-entrypoint-initdb.d/init.sql",
          mode: "ro",
        },
      ]);
    }

    this.container = await containerBuilder.start();

    // CRÍTICO para WSL2: Forçar IP em vez de localhost
    this.host = "127.0.0.1";
    this.port = this.container.getMappedPort(3306);

    const conn = await mysql.createConnection({
      host: this.host,
      port: this.port,
      user: dbTestConfig.username,
      password: dbTestConfig.password,
      database: dbTestConfig.database,
      connectTimeout: 5000,
    });

    try {
      if (this.options.loadSchemma) {
        const [rows]: any = await conn.query("SHOW TABLES;");
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error("❌ Schema não carregado no MySQL!");
        }
        console.log("✅ MySQL pronto e Schema validado!");
      } else {
        console.log("✅ MySQL pronto (Synchronize mode)!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("❌ Erro na validação do MySQL:", errorMessage);
      throw err;
    } finally {
      // GARANTE que o processo pode fechar
      await conn.end();
    }
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
          synchronize: this.options.loadSchemma ? false : true,
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
      await queryRunner.release(); // Liberta a ligação ao pool
    }
  }
}

/*
export const generateTestContainer = async (
    options: TestContainerOptions
): Promise<{ container: StartedMySqlContainer; module: TestingModule }> => {
    const sqlPath = path.join(__dirname, '../../../db.sql');
    const container = await new MySqlContainer('mysql:8.0')
        .withDatabase(dbTestConfig.database)
        .withUsername(dbTestConfig.username)
        .withUserPassword(dbTestConfig.password)
        .withCommand([
            '--character-set-server=utf8mb4',
            '--collation-server=utf8mb4_unicode_ci',
            '--default-authentication-plugin=mysql_native_password'
        ]).withBindMounts([
            {
                source: sqlPath.startsWith('/') ? sqlPath : `/${sqlPath.replace(/\\/g, '/')}`,
                target: '/docker-entrypoint-initdb.d/init.sql',         
                mode: 'ro',
           },

        ])
        .start();

    const host = container.getHost();
    const port = container.getMappedPort(3306);
    console.log(`🚀 MySQL subiu em ${host}:${port}`);
    const connection = await mysql.createConnection({
        host,
        port,
        user: dbTestConfig.username,
        password: dbTestConfig.password,
        database: dbTestConfig.database
    });
    await connection.end();
    console.log('✅ Ligação direta (mysql2) funcionou!');
    // teste if sql schemma was loaded
    const [rows] = await mysql.createConnection({
        host,
        port,
        user: dbTestConfig.username,
        password: dbTestConfig.password,
        database: dbTestConfig.database
    }).then(conn => conn.query("SHOW TABLES;"));
    console.log('Tables in test_db:', rows);
    if (!Array.isArray(rows) || !rows.length) {
        throw new Error('❌ Esquema SQL não foi carregado corretamente!');
    }

    const module = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'mysql',
                driver:mysql,
                host,
                port,
                username: dbTestConfig.username,
                password: dbTestConfig.password,
                database: dbTestConfig.database,
                entities: options.entities,
                synchronize: false,
                retryAttempts: 2,
                charset: 'utf8mb4',
            }),
            TypeOrmModule.forFeature(options.entities),
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
            ...options.providers,
        ],
    }).compile();

    return { container, module };
};

export const truncateTables = async (module: TestingModule) => {
    const dataSource = module.get(DataSource); 
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
    }
};
*/
