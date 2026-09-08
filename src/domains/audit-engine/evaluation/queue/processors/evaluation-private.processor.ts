import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EvaluationEngine } from '../../types/evaluation-engine.interface';
import { EvaluationStorage } from '../../types/evaluation-storage.interface';
import { EvaluationJobData } from '../../types';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EvaluationParserService } from '../../evaluation-parser.service';
import { EvaluationPersister } from '../../types/evaluation-persister.interface';
import { Inject } from '@nestjs/common';

@Processor(QUEUE_NAMES.EVAL_PRIVATE, {
  concurrency: 10,
})
export class EvaluationPrivateWorker extends WorkerHost {
  constructor(
    @InjectQueue(QUEUE_NAMES.EVAL_PRIVATE_DQL)
    private readonly dldqueue: Queue,
    @Inject(EvaluationEngine)
    private readonly evaluationEngine: EvaluationEngine,
    @Inject(EvaluationStorage)
    private readonly evaluationStore: EvaluationStorage,
    @Inject(EvaluationParserService)
    private readonly evaluationParser: EvaluationParserService,
    @Inject(EvaluationPersister)
    private readonly evaluationPersister: EvaluationPersister,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<EvaluationJobData, void, string>): Promise<any> {
    const { evaluationId, institutionId, directoryIds, websiteId, pageId, url } = job.data;

    const evaluationResult = await this.evaluationEngine.evaluate(url);
    if (!evaluationResult) throw Error('Evaluation Engine returned no result');
    job.updateProgress(50);
    job.log('Received Evaluation from Engine');
    const { data, pagecode, evaluationData } =
      this.evaluationParser.parseEvaluation(evaluationResult);
    job.log('Parsed Evaluation from result');

    const ingestionMetrics = this.evaluationParser.parseIngestionMetrics(
      evaluationId,
      directoryIds,
      institutionId,
      websiteId,
      pageId,
      data.score,
      data.date,
      data.metrics,
    );

    if (!ingestionMetrics) throw Error('Evaluation Parser returned no ingestion metrics');
    job.log('Prepared Metrics for ingestion');

    const evaluationDate = new Date(data.date).toISOString().slice(0, 10);

    this.evaluationStore.save({
      htmlContent: pagecode,
      nodes: data.nodes,
      evalIdentifier: {
        evaluationId,
        websiteId,
        pageId,
        evaluationDate,
      },
    });
    job.log('Saved compressed files in  Storage');
    job.updateProgress(70);

    await this.evaluationPersister.persist({
      evaluationId,
      websiteId,
      directoryId: 0,
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
  onActive(job: Job) {
    console.log(`🏃 Job ${job.id} começou a ser processado.`);
    this.eventEmitter.emit('evaluation.active', job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} terminou com sucesso!`);
    this.eventEmitter.emit('evaluation.completed', job.data);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    if (job.attemptsMade < 3) {
      job.retry();
    } else {
      this.dldqueue.add('failed-job', job);
      this.evaluationStore.delete({
        evaluationId: job.data.evaluationId,
        websiteId: job.data.websiteId,
        pageId: job.data.pageId,
        evaluationDate: new Date().toISOString(),
      });
      this.eventEmitter.emit('evaluation.failed', { jobData: job.data, error: error.message });
      console.error(` Job ${job.id} falhou: ${error.message}`);
    }
  }
}
