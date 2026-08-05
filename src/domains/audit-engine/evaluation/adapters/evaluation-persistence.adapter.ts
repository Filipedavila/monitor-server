import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { IEvaluationPersistence } from "../types/evaluation-persistence.interface"; 
import { EvaluationRepository } from "../evaluation.repository";
import { EvaluationStorageService } from "../evaluation-storage.service";
import { EvaluationProducer } from "../redis/evaluation.producer";
import { Evaluation } from "../entities/evaluation.entity";
import { IMetricData } from "../types";



@Injectable()
export class EvaluationPersistenceAdapter implements IEvaluationPersistence {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly evaluationStorageService: EvaluationStorageService,
    private readonly evaluationProducer: EvaluationProducer,
  ) {}

  async save(
    websiteId: number,
    evaluationId: number,
    pageId: number,
    result: any,
  ): Promise<any> {
    const evaluation = await this.evaluationRepository.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${evaluationId} not found`);
    }

    evaluation.pageTitle = result.data.title
      .replace(/"/g, "")
      .replace(/[\u0800-\uFFFF]/g, "");
    evaluation.score = result.data.score;
    
    const conform = result.data.conform.split("@");
    evaluation.A = conform[0];
    evaluation.AA = conform[1];
    evaluation.AAA = conform[2];
    evaluation.createdAt = new Date(result.data.date);

    const metrics: IMetricData[] = Object.entries(result.data.metrics).map(([key, value]) =>{
       return {
        evaluation_id: evaluationId,
        directory_id: 0,  // TODO , find way to extract website directory id and institution id on job passed to bullmq
        institution_id:0,
        website_id: websiteId,
        page_id: pageId,
        evaluation_date: new Date(result.data.date).toISOString().slice(0, 19).replace('T', ' '),
        score: evaluation.score,
        rule_id : key, 
        count: Number(value),
        rule_weight: 0.6,
        rule_trust: 1,
        rule_type: 'desc'  // todo get standard values at this time 
        
      }
    }
    );

    return await this.persistEvaluation(evaluation, pageId, websiteId, result, metrics);
  }

  private async persistEvaluation(evaluation: Evaluation, pageId: number, websiteId: number, result: any, metrics: IMetricData[]): Promise<Evaluation> {
    return await this.evaluationRepository.runInTransaction(async (queryRunner) => {
      const savedEvaluation = await queryRunner.manager.save(Evaluation, evaluation);
      if (!savedEvaluation) {
        throw new InternalServerErrorException(`Failed to save evaluation for page ID ${pageId}`);
      }

      await this.evaluationStorageService.saveEvaluation(
        {
          evaluationId: savedEvaluation.id,
          websiteId: websiteId.toString(),
          pageId: pageId.toString(),
          evaluationDate: savedEvaluation.createdAt.toISOString().split('T')[0],
        },
        result.pagecode,
        result.data.nodes
      );

      const idPublish = await this.evaluationProducer.publishEvaluations(metrics);
      if (!idPublish) {
        throw new InternalServerErrorException(
          `Failed to publish evaluation result for evaluation ID ${savedEvaluation.id}`
        );
      }

      return savedEvaluation;
    });
  }
}