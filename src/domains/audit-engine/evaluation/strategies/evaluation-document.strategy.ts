import { Injectable, Logger } from '@nestjs/common';
import { EvaluationPersister, EvaluationPersisterPayload } from '../types/evaluation-persister.interface';
import { EvaluationRepository } from '../evaluation.repository';
import { UnpublishedEvaluation } from '../entities/unpublished-evaluation.entity';
import { Evaluation, EvaluationStatus } from '../entities/evaluation.entity';


@Injectable()
export class EvaluationDocumentStrategy implements EvaluationPersister {
  private readonly logger = new Logger("EvaluationDocumentStrategy");

  constructor(
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  async persist(payload: EvaluationPersisterPayload): Promise<void> {
    const { evaluationId, websiteId, directoryId, institutionId, evaluationMetrics, basicResult } = payload;

    try {
      this.logger.log(`Starting document persistence workflow for Evaluation ID: ${evaluationId}`);
      await this.evaluationRepository.runInTransaction(async (queryRunner) => {
            // TODO: needs to be UPSERT
        await queryRunner.manager.save(UnpublishedEvaluation, {
          evaluationId,
          websiteId,
          directoryId,
          institutionId,
          payload: evaluationMetrics,
          createdAt: new Date(basicResult.createdAt),
        });
        
        await queryRunner.manager.update(Evaluation, { id: evaluationId }, { 
            pageTitle: basicResult.title,
            A:basicResult.A,
            AA:basicResult.AA,
            AAA:basicResult.AAA,
            evaluationDate: new Date(basicResult.createdAt),
            status: EvaluationStatus.COMPLETED });

      });

    } catch (error) {
      this.logger.error(`Failed to persist evaluation data for ID: ${evaluationId}`, error);
      throw error;
    }
  }
}