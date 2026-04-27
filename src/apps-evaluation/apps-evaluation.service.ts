import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { AppsEvaluation } from "./apps-evaluation.entity";

@Injectable()
export class AppsEvaluationService {
  constructor(
    @InjectRepository(AppsEvaluation)
    private readonly appsEvaluationRepository: Repository<AppsEvaluation>,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async createOne(evaluation: AppsEvaluation): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.save(evaluation);

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

  async findLastestAppsEvaluation(applicationId: number): Promise<any> {
    const evaluations = await this.appsEvaluationRepository.find({
      where: { AppId: applicationId },
      order: { Date: "DESC" },
    });

    if (evaluations) {
      return evaluations[0];
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllAppsEvaluation(applicationId: number): Promise<any> {
    const evaluations = await this.appsEvaluationRepository.find({
      where: { AppId: applicationId },
    });

    if (evaluations) {
      return evaluations;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<any> {
    return await this.appsEvaluationRepository.find();
  }

  async findInfo(appsEvaluationId: number): Promise<any> {
    const evaluation = await this.appsEvaluationRepository.findOne({
      where: { AppsEvaluationId: appsEvaluationId },
    });

    if (evaluation) {
      return evaluation;
    } else {
      throw new InternalServerErrorException();
    }
  }
}
