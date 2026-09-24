import { Injectable, Logger } from '@nestjs/common';
import { PublishStatus } from '../../entities/evaluation.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import {
  EvaluationPersister,
  EvaluationPersisterPayload,
} from '../../contracts/evaluation-persister.contract';
import { EvaluationRepository } from '../../evaluation.repository';
import { EvaluationPublishingService } from '../../evaluation-publish.service';
import { Evaluation } from '../../entities/evaluation.entity';

@Injectable()
export class EvaluationDocumentStrategy implements EvaluationPersister {
  private readonly logger = new Logger('EvaluationDocumentStrategy');

  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly evaluationPublishingService: EvaluationPublishingService,
    private readonly outboxService: OutboxService,
  ) {}

  async persist(payload: EvaluationPersisterPayload): Promise<void> {
    const { evaluationId, evaluationMetrics, basicResult, pageId } = payload;

    try {
      this.logger.log(`Starting document persistence workflow for Evaluation ID: ${evaluationId}`);

      await this.evaluationRepository.runInTransaction(async (queryRunner) => {
        // TODO: needs to be UPSERT

        // TODO : ATTENTION , FOR TESTING PURPOSE ONLY.. SHOULD BE PUT IN OUTBOX TO GARANTY AT LEAST ONCE DELIVERY
        await this.evaluationPublishingService.execute(evaluationMetrics);
        /*
        await this.outboxService.putInOutbox(queryRunner.manager, {
          evaluationId,
          websiteId,
          directoryId,
          institutionId,
          payload: evaluationMetrics,
          createdAt: new Date(basicResult.createdAt),
        });
        */

        await queryRunner.manager.upsert(
          Evaluation,
          {
            id: evaluationId,
            pageTitle: basicResult.title,
            pageId: pageId,
            A: basicResult.A,
            AA: basicResult.AA,
            AAA: basicResult.AAA,
            evaluationDate: new Date(basicResult.createdAt),
            status: PublishStatus.STAGED,
            score: basicResult.score,
            tagCount: basicResult.tagCount,
          },
          ['id'],
        );
      });
    } catch (error) {
      this.logger.error(`Failed to persist evaluation data for ID: ${evaluationId}`, error);
      throw error;
    }
  }
}
