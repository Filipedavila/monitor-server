import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource } from "typeorm";
import { AppsEntity } from "./apps-entity.entity";

@Injectable()
export class AppsEntityService {
  constructor(
    @InjectRepository(AppsEntity)
    private readonly appsEntityRepository: Repository<AppsEntity>,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async createOne(entity: AppsEntity, applications: string[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertEntity = await queryRunner.manager.save(entity);

      for (const applicationId of applications || []) {
        await queryRunner.manager.query(
          `INSERT INTO AppsEntityApplication (AppsEntityId, ApplicationId) VALUES (?, ?)`,
          [insertEntity.AppsEntityId, applicationId]
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

  async update(appsEntityId: number, shortName: string, longName: string, applications: number[], defaultApplications: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        AppsEntity,
        { AppsEntityId: appsEntityId },
        { Short_Name: shortName, Long_Name: longName }
      );

      for (const id of defaultApplications || []) {
        if (!applications.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM AppsEntityApplication WHERE AppsEntityId = ? AND ApplicationId = ?`,
            [appsEntityId, id]
          );
        }
      }

      for (const id of applications || []) {
        if (!defaultApplications.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO AppsEntityApplication (AppsEntityId, ApplicationId) VALUES (?, ?)`,
            [appsEntityId, id]
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

  async deleteOne(appsEntityId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsEntityApplication WHERE AppsEntityId = ? AND ApplicationId <> 0`,
        [appsEntityId]
      );

      await queryRunner.manager.delete(AppsEntity, {
        AppsEntityId: appsEntityId 
      });

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

  async deleteList(appsEntitiesId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM AppsEntityApplication WHERE AppsEntityId IN (?) AND ApplicationId <> 0`,
        [appsEntitiesId]
      );

      await queryRunner.manager.delete(AppsEntity, {
        AppsEntityId: In(appsEntitiesId),
      });

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

  async findAll(): Promise<any> {
    return this.appsEntityRepository.query(
      `SELECT 
        e.*,
        COUNT(distinct ea.ApplicationId) as Applications 
      FROM 
        AppsEntity as e
        LEFT OUTER JOIN AppsEntityApplication as ea ON ea.AppsEntityId = e.AppsEntityId
      GROUP BY e.AppsEntityId`
    );
  }

  async findNumberOfAppsObservatory(): Promise<any> {
    return await this.appsEntityRepository.count();
  }

  async findInfo(appsEntityId: number): Promise<any> {
    const appsEntity = await this.appsEntityRepository.findOne({
      where: { AppsEntityId: appsEntityId },
    });

    if (appsEntity) {
      appsEntity.Applications = await this.appsEntityRepository.query(
        `SELECT a.*
        FROM 
          AppsEntityApplication as ea, 
          Application as a
        WHERE 
          ea.AppsEntityId = ? AND 
          a.ApplicationId = ea.ApplicationId`,
        [appsEntityId]
      );

      return appsEntity;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllAppsEntityApplications(appsEntity: string): Promise<any> {
    const applications = await this.appsEntityRepository.query(`
      SELECT
        a.*
      FROM
        AppsEntity as e,
        AppsEntityApplication as ea,
        Application as a
      WHERE
        e.Short_Name = ? AND
        ea.AppsEntityId = e.AppsEntityId AND
        a.ApplicationId = ea.ApplicationId
      GROUP BY a.ApplicationId`,
      [appsEntity]
    );

    return applications;
  }
}
