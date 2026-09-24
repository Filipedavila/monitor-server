import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EvaluationEngine } from '../../contracts/evaluation-engine.contract';
import { EvaluationStorage } from '../../contracts/evaluation-storage.contract';
import { EvaluationJobData } from '../../types';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EvaluationParserService } from '../../evaluation-parser.service';
import { Inject, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EvaluationRepository } from '../../evaluation.repository';
import { EvaluationPersister } from '../../contracts/evaluation-persister.contract';
import { Evaluation } from '../../entities/evaluation.entity';
import { PageStatus } from 'src/domains/inventory/page/page-contexts.entity';

const CONTEXT_ID = 1;

type CompensationAction = () => Promise<void>;

@Processor(QUEUE_NAMES.EVAL_PRIVATE, {
  concurrency: 2,
  lockDuration: 180000,
})
export class EvaluationPrivateWorker extends WorkerHost {
  private readonly logger = new Logger(EvaluationPrivateWorker.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EVAL_PRIVATE_DLQ)
    private readonly dldqueue: Queue,
    @Inject(EvaluationEngine)
    private readonly evaluationEngine: EvaluationEngine,
    @Inject(EvaluationStorage)
    private readonly evaluationStore: EvaluationStorage,
    @Inject(EvaluationParserService)
    private readonly evaluationParser: EvaluationParserService,
    @Inject(EvaluationPersister)
    private readonly evaluationPersister: EvaluationPersister,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly eventEmitter: EventEmitter2,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<EvaluationJobData, void, string>): Promise<void> {
    const { institutionId, evaluationId, directoryIds, websiteId, pageId, url } = job.data;
    let evaluationIdJob = evaluationId;

    const compensations: CompensationAction[] = [];

    try {
      const evaluationResult = await this.evaluationEngine.evaluate(url);
      if (!evaluationResult) throw Error('Evaluation Engine returned no result');

      await job.updateProgress(30);

      const { evaluationReport, evaluationData } =
        this.evaluationParser.parseEvaluation(evaluationResult);
      const evaluationDate = evaluationReport.metadata.evaluatedAt;

      if (!evaluationIdJob) {
        const evaluation = new Evaluation();
        evaluation.evaluationDate = new Date(evaluationDate);
        evaluation.pageId = pageId;

        const created = await this.evaluationRepository.createEvaluation(evaluation, CONTEXT_ID);
        evaluationIdJob = created.id;

        compensations.push(async () => {
          this.logger.warn(`Compensação: A apagar evaluation ${evaluationIdJob} da BD...`);
          await this.evaluationRepository.delete(evaluationIdJob!);
        });

        await job.updateData({
          ...job.data,
          evaluationId: evaluationIdJob,
        });
      }

      const ingestionMetrics = this.evaluationParser.parseIngestionMetrics(
        evaluationIdJob,
        directoryIds,
        institutionId,
        websiteId,
        pageId,
        evaluationReport.scoring.score,
        evaluationDate,
        evaluationReport.scoring.rulesOccurrences,
      );

      if (!ingestionMetrics) throw Error('Evaluation Parser returned no ingestion metrics');
      await job.updateProgress(60);

      const storageEvaluationDate = new Date(evaluationDate).toISOString().slice(0, 10);

      await this.evaluationStore.save({
        htmlContent: evaluationReport.snapshot.html,
        nodes: evaluationReport.scoring.assertionEvidence,
        evalIdentifier: {
          evaluationId: evaluationIdJob,
          websiteId,
          pageId,
          evaluationDate: storageEvaluationDate,
        },
      });

      compensations.push(async () => {
        this.logger.warn(
          `Compensação: A apagar ficheiros do storage para evaluation ${evaluationIdJob}...`,
        );
        await this.evaluationStore.delete({
          evaluationId: evaluationIdJob!,
          websiteId,
          pageId,
          evaluationDate: storageEvaluationDate,
        });
      });

      await job.updateProgress(80);

      await this.evaluationPersister.persist({
        evaluationId: evaluationIdJob,
        websiteId,
        directoryId: directoryIds[0],
        pageId,
        institutionId,
        evaluationMetrics: ingestionMetrics,
        basicResult: evaluationData,
        contextId: CONTEXT_ID,
      });

      await this.dataSource.query(
        `
        UPDATE page_contexts_ams
        SET page_status = $1
        WHERE page_id = $2;
        `,
        [PageStatus.EVALUATED, pageId],
      );

      await job.updateProgress(100);
      job.log('Evaluation Resolution Ended');

      this.eventEmitter.emit('evaluation.completed', {
        ...job.data,
        evaluationId: evaluationIdJob,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Erro no job ${job.id} (Página ${pageId}): ${err.message}`, err.stack);

      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      await this.executeCompensations(compensations);

      if (isFinalAttempt) {
        await this.handleFinalFailure(job, err);
      }

      throw err;
    }
  }

  private async executeCompensations(compensations: CompensationAction[]): Promise<void> {
    while (compensations.length > 0) {
      const rollback = compensations.pop();
      if (rollback) {
        try {
          await rollback();
        } catch (compensationError) {
          const msg =
            compensationError instanceof Error
              ? compensationError.message
              : String(compensationError);
          this.logger.error(`Falha ao executar ação de compensação: ${msg}`);
        }
      }
    }
  }

  private async handleFinalFailure(job: Job<EvaluationJobData>, error: Error): Promise<void> {
    try {
      await this.dldqueue.add('failed-job', {
        originalJobId: job.id,
        data: job.data,
        error: {
          message: error.message,
          stack: error.stack,
        },
        failedAt: new Date().toISOString(),
      });
    } catch (dlqError) {
      const errorMessage = dlqError instanceof Error ? dlqError.message : String(dlqError);
      this.logger.error(`Failed to push job ${job.id} to DLQ: ${errorMessage}`);
    }

    try {
      await this.dataSource.query(
        `
        UPDATE page_contexts_ams
        SET page_status = $1
        WHERE page_id = $2;
        `,
        [PageStatus.FAILED, job.data.pageId],
      );

      this.eventEmitter.emit('evaluation.failed', {
        jobData: job.data,
        error: error.message,
      });
    } catch (cleanupError) {
      const errorMessage =
        cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      this.logger.error(
        `Falha ao marcar status FAILED para a página ${job.data.pageId}: ${errorMessage}`,
      );
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`🏃 Job ${job.id} começou a ser processado.`);
    this.eventEmitter.emit('evaluation.active', job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} terminou com sucesso!`);
  }
}
