import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { Application } from "./application.entity";

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async createOne(application: Application, entities: string[], categories: string[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertApplication = await queryRunner.manager.save(application);

      for (const entityId of entities || []) {
        await queryRunner.manager.query(
          `INSERT INTO AppsEntityApplication (AppsEntityId, ApplicationId) VALUES (?, ?)`,
          [entityId, insertApplication.ApplicationId]
        );
      }

      for (const categoryId of categories || []) {
        await queryRunner.manager.query(
          `INSERT INTO AppsCategoryApplication (AppsCategoryId, ApplicationId) VALUES (?, ?)`,
          [categoryId, insertApplication.ApplicationId]
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async update(applicationId: number, userId: number, name: string, downloadUrl: string, operatingSystem: string, stamp: number, stampUpdateDate: any, declaration: number, declarationUpdateDate: any, entities: number[], defaultEntities: number[], categories: number[], defaultCategories: number[]) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        Application,
        { ApplicationId: applicationId },
        {
          UserId: userId,
          Name: name,
          DownloadUrl: downloadUrl,
          Declaration: declaration,
          DeclarationUpdateDate: declarationUpdateDate,
          Stamp: stamp,
          StampUpdateDate: stampUpdateDate,
          OperatingSystem: operatingSystem,
        }
      );

      for (const id of defaultEntities || []) {
        if (!entities?.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM AppsEntityApplication WHERE AppsEntityId = ? AND ApplicationId = ?`,
            [id, applicationId]
          );
        }
      }

      for (const id of entities || []) {
        if (!defaultEntities?.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO AppsEntityApplication (AppsEntityId, ApplicationId) VALUES (?, ?)`,
            [id, applicationId]
          );
        }
      }

      for (const id of defaultCategories || []) {
        if (!categories?.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM AppsCategoryApplication WHERE AppsCategoryId = ? AND ApplicationId = ?`,
            [id, applicationId]
          );
        }
      }

      for (const id of categories || []) {
        if (!defaultCategories?.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO AppsCategoryApplication (AppsCategoryId, ApplicationId) VALUES (?, ?)`,
            [id, applicationId]
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async deleteOne(applicationId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsCategoryApplication WHERE ApplicationId = ? AND AppsCategoryId <> 0`,
        [applicationId]
      );

      await queryRunner.manager.query(
        `DELETE FROM AppsEntityApplication WHERE ApplicationId = ? AND AppsEntityId <> 0`,
        [applicationId]
      );

      await queryRunner.manager.delete(Application, {
        ApplicationId: applicationId 
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async deleteList(applicationsId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsCategoryApplication WHERE ApplicationId IN (?) AND AppsCategoryId <> 0`,
        [applicationsId]
      );

      await queryRunner.manager.query(
        `DELETE FROM AppsEntityApplication WHERE ApplicationId IN (?) AND AppsEntityId <> 0`,
        [applicationsId]
      );

      await queryRunner.manager.delete(Application, { 
        ApplicationId: In(applicationsId),
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async findNumberOfAppsObservatory(): Promise<any> {
    return await this.applicationRepository.count();
  }

  async findNumberOfMissingEvaluation(): Promise<any> {
    const applicationsEvaluated = await this.applicationRepository.query(`
      SELECT
        e.AppId
      FROM
        AppsEvaluation as e`
    );

    if (applicationsEvaluated.length === 0) {
      return await this.applicationRepository.count();
    }

    return await this.applicationRepository.query(
      `SELECT
        COUNT(distinct a.ApplicationId)
      FROM
        Application as a
      WHERE
        a.ApplicationId NOT IN (?)`,
      [applicationsEvaluated]
    );
  }

  async findInfo(applicationId: number): Promise<any> {
    const application = await this.applicationRepository.findOne({
      where: { ApplicationId: applicationId },
    });

    if (application) {
      application.Categories = await this.applicationRepository.query(
        `SELECT c.* FROM AppsCategory as c, AppsCategoryApplication as ca WHERE ca.ApplicationId = ? AND c.AppsCategoryId = ca.AppsCategoryId`,
        [applicationId]
      );

      application.Entities = await this.applicationRepository.query(
        `SELECT e.* FROM AppsEntity as e, AppsEntityApplication as ea WHERE ea.ApplicationId = ? AND e.AppsEntityId = ea.AppsEntityId`,
        [applicationId]
      );
      return application;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<any> {
    const applications = await this.applicationRepository.query(
      `SELECT 
        a.*,
        COUNT(distinct ea.AppsEntityId) as Entities,
        COUNT(distinct ca.AppsCategoryId) as Categories
      FROM 
        Application as a
        LEFT OUTER JOIN AppsEntityApplication as ea ON ea.ApplicationId = a.ApplicationId
        LEFT OUTER JOIN AppsCategoryApplication as ca ON ca.ApplicationId = a.ApplicationId
      GROUP BY a.ApplicationId`
    );
    return applications;
  }
}
