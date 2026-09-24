import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Evaluation, PublishStatus } from '../../entities/evaluation.entity';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EvaluationEngine } from '../../contracts/evaluation-engine.contract';
import { EvaluationStorage } from '../../contracts/evaluation-storage.contract';
import { EvaluationParserService } from '../../evaluation-parser.service';
import { EvaluationRepository } from '../../evaluation.repository';
import { EvaluationJobData } from '../../types';
import { Inject, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PageStatus } from 'src/domains/inventory/page/page-contexts.entity';

const CONTEXT_ID = 2;

type CompensationAction = () => Promise<void>;

@Processor(QUEUE_NAMES.EVAL_PUBLIC, {
  concurrency: 2, // Ajustado para evitar contenção de CPU e perdas de Lock
  lockDuration: 180000,
})
export class EvaluationPublicWorker extends WorkerHost {
  private readonly logger = new Logger(EvaluationPublicWorker.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EVAL_PUBLIC_DLQ)
    private readonly dldqueue: Queue,
    @Inject(EvaluationEngine)
    private readonly evaluationEngine: EvaluationEngine,
    @Inject(EvaluationStorage)
    private readonly evaluationStore: EvaluationStorage,
    @Inject(EvaluationParserService)
    private readonly evaluationParser: EvaluationParserService,
    private readonly evaluationRepository: EvaluationRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<EvaluationJobData, void, string>): Promise<void> {
    const { websiteId, evaluationId, pageId, url } = job.data;
    let evaluationIdJob = evaluationId;

    const compensations: CompensationAction[] = [];

    try {
      const evaluationResult = await this.evaluationEngine.evaluate(url);
      if (!evaluationResult) throw new Error('Evaluation Engine returned no result');

      await job.updateProgress(50);
      job.log('Received Evaluation from Engine');

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
          this.logger.warn(`Compensação: A remover evaluation ${evaluationIdJob} da BD...`);
          await this.evaluationRepository.delete(evaluationIdJob!);
        });

        await job.updateData({
          ...job.data,
          evaluationId: evaluationIdJob,
        });
      }

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

      // Regista a compensação para o Storage
      compensations.push(async () => {
        this.logger.warn(
          `Compensação: A remover ficheiros do storage para evaluation ${evaluationIdJob}...`,
        );
        await this.evaluationStore.delete({
          evaluationId: evaluationIdJob!,
          websiteId,
          pageId,
          evaluationDate: storageEvaluationDate,
        });
      });

      job.log('Saved compressed files in Storage');
      await job.updateProgress(70);

      await this.evaluationRepository.updateEntityFromRawData(evaluationIdJob, evaluationData);
      await this.evaluationRepository.updateStatus(evaluationIdJob, PublishStatus.STAGED);

      await this.dataSource.query(
        `
        UPDATE page_contexts_monitor
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
        failedReason: error.message,
        stacktrace: error.stack,
        failedAt: new Date().toISOString(),
      });
    } catch (dlqError) {
      const errorMessage = dlqError instanceof Error ? dlqError.message : String(dlqError);
      this.logger.error(`Failed to push job ${job.id} to DLQ: ${errorMessage}`);
    }

    try {
      await this.dataSource.query(
        `
        UPDATE page_contexts_monitor
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
      const cleanupErrorMessage =
        cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      this.logger.error(
        `Failed to execute cleanup logic for job ${job.id}: ${cleanupErrorMessage}`,
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
