import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

import { AppsDirectory } from "./apps-directory.entity";

@Injectable()
export class AppsDirectoryService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
    @InjectRepository(AppsDirectory)
    private readonly appsDirectoryRepository: Repository<AppsDirectory>
  ) {}

  async createOne(directory: AppsDirectory, categories: number[]) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertAppsDirectory = await queryRunner.manager.save(directory);

      for (const categoryId of categories || []) {
        await queryRunner.manager.query(
          `INSERT INTO AppsDirectoryAppsCategory (AppsDirectoryId, AppsCategoryId) VALUES (?, ?)`,
          [insertAppsDirectory.AppsDirectoryId, categoryId]
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
    appsDirectoryId: number,
    name: string,
    method: number,
    defaultCategories: number[],
    categories: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        AppsDirectory,
        { AppsDirectoryId: appsDirectoryId },
        { Name: name, Method: method }
      );

      for (const id of defaultCategories || []) {
        if (!categories.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM AppsDirectoryAppsCategory WHERE AppsDirectoryId = ? AND AppsCategoryId = ?`,
            [appsDirectoryId, id]
          );
        }
      }

      for (const id of categories || []) {
        if (!defaultCategories.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO AppsDirectoryAppsCategory (AppsDirectoryId, AppsCategoryId) VALUES (?, ?)`,
            [appsDirectoryId, id]
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

  async deleteOne(appsDirectoryId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsDirectoryAppsCategory WHERE AppsDirectoryId = ? AND AppsCategoryId <> 0`,
        [appsDirectoryId]
      );

      await queryRunner.manager.delete(AppsDirectory, { 
        AppsDirectoryId: appsDirectoryId 
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

  async deleteList(appsDirectoriesId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsDirectoryAppsCategory WHERE AppsDirectoryId IN (?) AND AppsCategoryId <> 0`,
        [appsDirectoriesId]
      );

      await queryRunner.manager.delete(AppsDirectory, {
        AppsDirectoryId: In(appsDirectoriesId),
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
    return this.appsDirectoryRepository.query(`SELECT 
        d.*,
        COUNT(distinct dc.AppsCategoryId) as Categories
      FROM 
        AppsDirectory as d
        LEFT OUTER JOIN AppsDirectoryAppsCategory as dc ON dc.AppsDirectoryId = d.AppsDirectoryId
      GROUP BY d.AppsDirectoryId`);
  }

  async findNumberOfAppsObservatory(): Promise<any> {
    return await this.appsDirectoryRepository.count();
  }

  async findInfo(appsDirectoryId: number): Promise<any> {
    const appsDirectory = await this.appsDirectoryRepository.findOne({
      where: { AppsDirectoryId: appsDirectoryId },
    });

    if (appsDirectory) {
      appsDirectory.Categories = await this.appsDirectoryRepository.query(
        `SELECT c.* 
        FROM
          AppsDirectoryAppsCategory as dc,
          AppsCategory as c 
        WHERE
          dc.AppsDirectoryId = ? AND 
          c.AppsCategoryId = dc.AppsCategoryId`,
        [appsDirectoryId]
      );

      return appsDirectory;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllAppsDirectoryCategories(appsDirectory: string): Promise<any> {
    return this.appsDirectoryRepository.query(
      `SELECT 
        c.*,
        COUNT(distinct ca.ApplicationId) as Applications 
      FROM
        AppsDirectory as d
        LEFT OUTER JOIN AppsDirectoryAppsCategory as dc ON dc.AppsDirectoryId = d.AppsDirectoryId
        LEFT OUTER JOIN AppsCategory as c ON c.AppsCategoryId = dc.AppsCategoryId
        LEFT OUTER JOIN AppsCategoryApplication as ca ON ca.AppsCategoryId = c.AppsCategoryId
      WHERE
        d.Name = ?
      GROUP BY c.AppsCategoryId`,
      [appsDirectory]
    );
  }

  async findAllAppsDirectoryApplications(appsDirectory: string): Promise<any> {
    const directory = await this.appsDirectoryRepository.query(
      `SELECT * FROM AppsDirectory WHERE Name = ? LIMIT 1`,
      [appsDirectory]
    );

    const method = directory[0].Method;

    const nCategories = await this.appsDirectoryRepository.query(
      `SELECT dc.* FROM AppsDirectory as d, AppsDirectoryAppsCategory as dc WHERE d.Name = ? AND dc.AppsDirectoryId = d.AppsDirectoryId`,
      [appsDirectory]
    );

    if (nCategories.length === 0) {
      return [];
    }

    if (method === 0) {
      const applications = await this.appsDirectoryRepository.query(
        `SELECT * FROM AppsCategoryApplication WHERE AppsCategoryId IN (?)`,
        [nCategories.map((dc) => dc.AppsCategoryId)]
      );

      const counts = {};
      for (const a of applications ?? []) {
        if (counts[a.ApplicationId]) {
          counts[a.ApplicationId]++;
        } else {
          counts[a.ApplicationId] = 1;
        }
      }

      const applicationsToFetch = new Array<Number>();
      for (const id of Object.keys(counts) ?? []) {
        if (counts[id] === nCategories.length) {
          applicationsToFetch.push(parseInt(id));
        }
      }

      return this.appsDirectoryRepository.query(
        `SELECT * FROM Application WHERE ApplicationId IN (?)`,
        [applicationsToFetch]
      );
    } else {
      return this.appsDirectoryRepository.query(
        `SELECT DISTINCT
          a.*
        FROM
          AppsCategoryApplication as ca,
          Application as a
        WHERE
          ca.AppsCategoryId IN (?) AND
          a.ApplicationId = ca.ApplicationId
        GROUP BY
          a.ApplicationId`,
        [nCategories.map((c) => c.AppsCategoryId)]
      );
    }
  }
}
