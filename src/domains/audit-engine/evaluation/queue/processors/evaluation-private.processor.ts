import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EvaluationEngine } from '../../contracts/evaluation-engine.contract';
import { EvaluationStorage } from '../../contracts/evaluation-storage.contract';
import { EvaluationJobData } from '../../types';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EvaluationParserService } from '../../evaluation-parser.service';
import { Inject } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EvaluationPersister } from '../../contracts/evaluation-persister.contract';
import { Evaluation } from '../../entities/evaluation.entity';
import { PageStatus } from 'src/domains/inventory/page/page-contexts.entity';

@Processor(QUEUE_NAMES.EVAL_PRIVATE, {
  concurrency: 10,
})
export class EvaluationPrivateWorker extends WorkerHost {
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
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    private eventEmitter: EventEmitter2,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<EvaluationJobData, void, string>): Promise<void> {
    const { institutionId, evaluationId, directoryIds, websiteId, pageId, url } = job.data;
    let evaluationIdJob = evaluationId;
    const evaluationResult = await this.evaluationEngine.evaluate(url);
    if (!evaluationResult) throw Error('Evaluation Engine returned no result');
    job.updateProgress(50);
    job.log('Received Evaluation from Engine');
    const { evaluationReport, evaluationData } =
      this.evaluationParser.parseEvaluation(evaluationResult);
    const evaluationDate = evaluationReport.metadata.evaluatedAt;
    if (!evaluationIdJob) {
      const evaluation = new Evaluation();
      evaluation.evaluationDate = new Date(evaluationDate);
      evaluation.pageId = pageId;
      evaluationIdJob = (await this.evaluationRepository.save(evaluation)).id;
      await job.updateData({
        ...job.data,
        evaluationId: evaluationIdJob,
      });
    }
    this.evaluationStore.save({
      htmlContent: evaluationReport.snapshot.html,
      nodes: evaluationReport.scoring.assertionEvidence,
      evalIdentifier: {
        evaluationId: evaluationIdJob,
        websiteId,
        pageId,
        evaluationDate,
      },
    });

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
    job.log('Prepared Metrics for ingestion');

    const storageEvaluationDate = new Date(evaluationDate).toISOString().slice(0, 10);

    this.evaluationStore.save({
      htmlContent: evaluationReport.snapshot.html,
      nodes: evaluationReport.scoring.assertionEvidence,
      evalIdentifier: {
        evaluationId: evaluationIdJob,
        websiteId,
        pageId,
        evaluationDate: storageEvaluationDate,
      },
    });
    job.log('Saved compressed files in  Storage');
    job.updateProgress(70);

    await this.evaluationPersister.persist({
      evaluationId: evaluationIdJob,
      websiteId,
      directoryId: directoryIds[0],
      institutionId: job.data.institutionId,
      evaluationMetrics: ingestionMetrics,
      basicResult: evaluationData,
    });

    job.log('Persisted Evaluation Data');
    job.updateProgress(90);
    job.updateProgress(100);
    job.log('Evaluation Resolution Endend');
  }

  @OnWorkerEvent('active')
  async onActive(job: Job) {
    console.log(`🏃 Job ${job.id} começou a ser processado.`);

    this.eventEmitter.emit('evaluation.active', job.data);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    await this.dataSource.query(
      `
            UPDATE page_contexts_ams
            SET page_status = $1
            WHERE page_id = $2;
            `,
      [PageStatus.EVALUATED, job.data.pageId],
    );
    console.log(`Job ${job.id} terminou com sucesso!`);
    this.eventEmitter.emit('evaluation.completed', job.data);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    if (job.attemptsMade < 3) {
      job.retry();
    } else {
      this.dldqueue.add('failed-job', job);

      if (job.data.evaluationId) {
        // Update page Context Status
        await this.evaluationStore.delete({
          evaluationId: job.data.evaluationId,
          websiteId: job.data.websiteId,
          pageId: job.data.pageId,
          evaluationDate: new Date().toISOString(),
        });
        await this.evaluationRepository.delete(job.data.evaluationId);
      }

      await this.dataSource.query(
        `
            UPDATE page_contexts_ams
            SET page_status = $1
            WHERE page_id = $2;
            `,
        [PageStatus.FAILED, job.data.pageId],
      );
      this.eventEmitter.emit('evaluation.failed', { jobData: job.data, error: error.message });
      console.error(` Job ${job.id} falhou: ${error.message}`);
    }
  }
}
