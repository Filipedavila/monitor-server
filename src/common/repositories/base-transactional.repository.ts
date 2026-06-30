import { DataSource, QueryRunner, Repository } from "typeorm";
import { EntityRepository } from "./base.repository";
import { IsolationLevel } from "typeorm/driver/types/IsolationLevel.js";

import { BaseFilter, BasePagination, BaseSort } from "../interfaces/types";
import { AppLoggerService } from "@core/app-logger/app-logger.service";
import { IdentifiableModel } from "../interfaces/Identifiable.interface";
import { ConfigService } from "@nestjs/config";

export abstract class BaseTransactionalRepository<
  T extends IdentifiableModel,
  F extends BaseFilter = BaseFilter,
  S extends BaseSort = BaseSort,
  P extends BasePagination = BasePagination,
> extends EntityRepository<T, F, S, P> {
  protected readonly dataSource: DataSource;
  constructor(
    orm: Repository<T>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(orm, logger, configService);
    this.dataSource = orm.manager.connection;
  }

  async runInTransaction<R>(
    operation: (queryRunner: QueryRunner) => Promise<R>,
    isolationLevel: IsolationLevel = "READ COMMITTED",
  ): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction(isolationLevel);

    try {
      const result = await operation(queryRunner);

      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
