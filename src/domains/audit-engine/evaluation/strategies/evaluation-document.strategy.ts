import { Injectable, Logger } from '@nestjs/common';
import {
  EvaluationPersister,
  EvaluationPersisterPayload,
} from '../types/evaluation-persister.interface';
import { EvaluationRepository } from '../evaluation.repository';
import { Evaluation, EvaluationStatus } from '../entities/evaluation.entity';
import { EvaluationPublishingService } from '../evaluation-publish.service';

@Injectable()
export class EvaluationDocumentStrategy implements EvaluationPersister {
  private readonly logger = new Logger('EvaluationDocumentStrategy');

  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly evaluationPublishingService: EvaluationPublishingService,
  ) {}

  async persist(payload: EvaluationPersisterPayload): Promise<void> {
    const { evaluationId, websiteId, directoryId, institutionId, evaluationMetrics, basicResult } =
      payload;

    try {
      this.logger.log(`Starting document persistence workflow for Evaluation ID: ${evaluationId}`);

      await this.evaluationRepository.runInTransaction(async (queryRunner) => {
        // TODO: needs to be UPSERT

        // TODO : ATTENTION , FOR TESTING PURPOSE ONLY.. SHOULD BE PUT IN OUTBOX TO GARANTY AT LEAST ONCE DELIVERY
        await this.evaluationPublishingService.execute(evaluationMetrics);
        /* await queryRunner.manager.upsert(UnpublishedEvaluation, {
          evaluationId,
          websiteId,
          directoryId,
          institutionId,
          payload: evaluationMetrics,
          createdAt: new Date(basicResult.createdAt),
        });*/

        await queryRunner.manager.update(
          Evaluation,
          { id: evaluationId },
          {
            pageTitle: basicResult.title,
            A: basicResult.A,
            AA: basicResult.AA,
            AAA: basicResult.AAA,
            evaluationDate: new Date(basicResult.createdAt),
            status: EvaluationStatus.COMPLETED,
          },
        );
      });
    } catch (error) {
      this.logger.error(`Failed to persist evaluation data for ID: ${evaluationId}`, error);
      throw error;
    }
  }
}
