import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, IsNull, In } from "typeorm";
import { AppsCategory } from "./apps-category.entity";
import { Application } from "src/application/application.entity"; 

@Injectable()
export class AppsCategoryService {
  constructor(
    @InjectRepository(AppsCategory)
    private readonly appsCategoryRepository: Repository<AppsCategory>,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async createOne(
    appsCategory: AppsCategory,
    directories: number[],
    applications: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertAppsCategory = await queryRunner.manager.save(appsCategory);

      for (const appsDirectoryId of directories || []) {
        await queryRunner.manager.query(
          `INSERT INTO AppsDirectoryAppsCategory (AppsDirectoryId, AppsCategoryId) VALUES (?, ?)`,
          [appsDirectoryId, insertAppsCategory.AppsCategoryId]
        );
      }

      for (const applicationId of applications || []) {
        await queryRunner.manager.query(
          `INSERT INTO AppsCategoryApplication (AppsCategoryId, ApplicationId) VALUES (?, ?)`,
          [insertAppsCategory.AppsCategoryId, applicationId]
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async update(
    appsCategoryId: number,
    name: string,
    defaultDirectories: number[],
    directories: number[],
    defaultApplications: number[],
    applications: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        AppsCategory,
        { AppsCategoryId: appsCategoryId },
        { Name: name }
      );

      for (const id of defaultDirectories || []) {
        if (!directories.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM AppsDirectoryAppsCategory WHERE AppsDirectoryId = ? AND AppsCategoryId = ?`,
            [id, appsCategoryId]
          );
        }
      }

      for (const id of directories || []) {
        if (!defaultDirectories.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO AppsDirectoryAppsCategory (AppsDirectoryId, AppsCategoryId) VALUES (?, ?)`,
            [id, appsCategoryId]
          );
        }
      }

      for (const id of defaultApplications || []) {
        if (!applications.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM AppsCategoryApplication WHERE AppsCategoryId = ? AND ApplicationId = ?`,
            [appsCategoryId, id]
          );
        }
      }

      for (const id of applications || []) {
        if (!defaultApplications.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO AppsCategoryApplication (AppsCategoryId, ApplicationId) VALUES (?, ?)`,
            [appsCategoryId, id]
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async deleteOne(appsCategoryId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsCategoryApplication WHERE AppsCategoryId = ? AND ApplicationId <> 0`,
        [appsCategoryId]
      );

      await queryRunner.manager.query(
        `DELETE FROM AppsDirectoryAppsCategory WHERE AppsCategoryId = ? AND AppsDirectoryId <> 0`,
        [appsCategoryId]
      );

      await queryRunner.manager.delete(AppsCategory, { 
        AppsCategoryId: appsCategoryId 
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

  async deleteList(appsCategoriesId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsCategoryApplication WHERE AppsCategoryId IN (?) AND ApplicationId <> 0`,
        [appsCategoriesId]
      );

      await queryRunner.manager.query(
        `DELETE FROM AppsDirectoryAppsCategory WHERE AppsCategoryId IN (?) AND AppsDirectoryId <> 0`,
        [appsCategoriesId]
      );

      await queryRunner.manager.delete(AppsCategory, { 
        AppsCategoryId: In(appsCategoriesId) 
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

  async findAll(): Promise<any> {
    const appsCategories = await this.appsCategoryRepository.query(`
      SELECT 
        c.*,
        COUNT(distinct ca.ApplicationId) as Applications
      FROM 
        AppsCategory as c
        LEFT OUTER JOIN AppsCategoryApplication as ca ON ca.AppsCategoryId = c.AppsCategoryId
      GROUP BY c.AppsCategoryId
    `);

    return appsCategories;
  }

  async findNumberOfAppsObservatory(): Promise<any> {
    return await this.appsCategoryRepository.count();
  }

  async findInfo(appsCategoryId: number): Promise<any> {
    const appsCategory = await this.appsCategoryRepository.findOne({
      where: { AppsCategoryId: appsCategoryId },
    });

    if (appsCategory) {
      appsCategory.Directories = await this.appsCategoryRepository.query(
        `SELECT d.* 
        FROM
          AppsDirectoryAppsCategory as dc,
          AppsDirectory as d
        WHERE
          dc.AppsCategoryId = ? AND 
          d.AppsDirectoryId = dc.AppsDirectoryId`,
        [appsCategoryId]
      );

      appsCategory.Applications = await this.appsCategoryRepository.query(
        `SELECT a.*
        FROM
          AppsCategoryApplication as ca,
          Application as a
        WHERE
          ca.AppsCategoryId = ? AND 
          a.ApplicationId = ca.ApplicationId`,
        [appsCategoryId]
      );

      return appsCategory;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllAppsCategoryApplications(appsCategory: string): Promise<any> {
    const applications = await this.appsCategoryRepository.query(`
      SELECT
        a.*
      FROM
        Application as a
        LEFT OUTER JOIN AppsCategoryApplication as ca ON ca.ApplicationId = a.ApplicationId
        LEFT OUTER JOIN AppsCategory as c ON c.AppsCategoryId = ca.AppsCategoryId
      WHERE
        c.Name = ?
      GROUP BY a.ApplicationId`,
      [appsCategory]
    );

    return applications;
  }
}
