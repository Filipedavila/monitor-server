import { DataSource,  QueryRunner, Repository } from 'typeorm';
import { EntityRepository } from './base.repository';

export abstract class BaseTransactionalRepository<T> extends EntityRepository<T> {
  protected readonly dataSource: DataSource;
  constructor(orm: Repository<T>
  ) {
    super(orm);
    this.dataSource = orm.manager.connection;
  }

async runInTransaction<R>(
    operation: (queryRunner: QueryRunner) => Promise<R>,
  ): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

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
