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
import { Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PageStatus } from 'src/domains/inventory/page/page-contexts.entity';

@Processor(QUEUE_NAMES.EVAL_PUBLIC, {
  concurrency: 10,
})
export class EvaluationPublicWorker extends WorkerHost {
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

    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<EvaluationJobData, void, string>): Promise<void> {
    const { websiteId, evaluationId, pageId, url } = job.data;
    let evaluationIdJob = evaluationId;
    const evaluationResult = await this.evaluationEngine.evaluate(url);
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
    job.log('Saved compressed files in  Storage');
    job.updateProgress(70);

    await this.evaluationRepository.updateEntityFromRawData(evaluationIdJob, evaluationData);
    job.updateProgress(100);
    job.log('Evaluation Resolution Ended');
    await this.evaluationRepository.updateStatus(evaluationIdJob, PublishStatus.STAGED);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`🏃 Job ${job.id} começou a ser processado.`);
    this.eventEmitter.emit('evaluation.active', job.data);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    console.log(`Job ${job.id} terminou com sucesso!`);
    await this.dataSource.query(
      `
            UPDATE page_contexts_monitor
            SET page_status = $1
            WHERE page_id = $2;
            `,
      [PageStatus.EVALUATED, job.data.pageId],
    );
    this.eventEmitter.emit('evaluation.completed', job.data);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    if (job.attemptsMade < 3) {
      job.retry();
    } else {
      await this.dldqueue.add('failed-job', job);
      if (job.data.evaluationId) {
        await this.evaluationRepository.delete(job.data.evaluationId);
      }
      await this.dataSource.query(
        `
            UPDATE page_contexts_monitor
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
