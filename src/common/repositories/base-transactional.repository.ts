import { DataSource,  QueryRunner, Repository } from 'typeorm';
import { EntityRepository } from './base.repository';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { BasePaginationDto } from '../dto/base-pagination.dto';

export abstract class BaseTransactionalRepository<
  T, 
  F extends BaseFilterDto = BaseFilterDto, 
  P extends BasePaginationDto = BasePaginationDto
> extends EntityRepository<T, F, P> {
  protected readonly dataSource: DataSource;
  constructor(orm: Repository<T>
  ) {
    super(orm);
    this.dataSource = orm.manager.connection;
  }


async runInTransaction<R>(
    operation: (queryRunner: QueryRunner) => Promise<R>,
    isolationLevel: IsolationLevel = 'READ COMMITTED',
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
