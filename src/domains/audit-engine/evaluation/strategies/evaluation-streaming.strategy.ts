import { Injectable, Logger } from '@nestjs/common';
import { EvaluationPersister, EvaluationPersisterPayload } from '../types/evaluation-persister.interface';
import { IMetricData } from '../types';
import { EvaluationRepository } from '../evaluation.repository';
import { EvaluationPublishingService } from '../evaluation-publish.service';
import { EvaluationStatus } from '../entities/evaluation.entity';

@Injectable()
export class EvaluationStreamingStrategy implements EvaluationPersister {
  constructor(private readonly evaluationPublisher: EvaluationPublishingService,
              private readonly evaluationRepository: EvaluationRepository,
              private readonly logger: Logger
  ) {}

  async persist(payload: EvaluationPersisterPayload): Promise<void> {
    const { evaluationId, websiteId, directoryId, institutionId, evaluationMetrics, basicResult } = payload;

    try {
      this.logger.log(`Starting persistence workflow for Evaluation ID: ${evaluationId}`);
      // FIXME: Usar outbox pattern para garantir ACID  com o redis publisher 
      await this.evaluationRepository.runInTransaction(async (manager) => {
        await this.evaluationRepository.updateStatus(evaluationId, EvaluationStatus.COMPLETED);
        await this.evaluationRepository.updateEntityFromRawData(evaluationId, basicResult);
        await this.evaluationPublisher.execute(evaluationMetrics);

      });

      this.logger.log(`Successfully persisted evaluation data for ID: ${evaluationId}`);
    } catch (error) {
      this.logger.error(`Failed to persist evaluation data for ID: ${evaluationId}`, error);
      throw error;
    }
  }

}