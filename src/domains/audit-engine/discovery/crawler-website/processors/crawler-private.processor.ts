import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IWebsiteScraper } from '../types/scraper.interface';
import { SsePublisherService } from '../../../../../core/sse/sse-publisher.service';
import { Repository } from 'typeorm';
import { CrawlerStatus, CrawlerWebsite } from '../entities/crawler-website.entity';
import { CrawlWebsiteHandler } from '../handlers/crawl-websites.handler';
import { InjectRepository } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';

@Processor('crawl-queue-private')
export class CrawlPrivateWorker extends WorkerHost {
  constructor(
    private readonly CrawlWebsiteHandler: CrawlWebsiteHandler,
    @InjectQueue(QUEUE_NAMES.CRAWL_PRIVATE_DLQ)
    private readonly dlqqueue: Queue,
    @InjectRepository(CrawlerWebsite)
    private readonly crawlerWebsiteRepository: Repository<CrawlerWebsite>,
    private readonly eventEmitter: EventEmitter2,
    private readonly SsePublisherService: SsePublisherService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    await this.CrawlWebsiteHandler.execute({
      id: job.data.crawlerId,
      baseUrl: job.data.baseUrl,
    });

    return { success: true };
  }

  @OnWorkerEvent('active')
  async onActive(job: Job) {
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-active',
      { jobId: job.id },
      'PRIVATE',
    );
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-active',
      { jobId: job.id },
      'AMS',
    );
  }

  @OnWorkerEvent('progress')
  async onProgress(job: Job, progress: number | object) {
    console.log(`Job ${job.id} está em ${progress}%`);
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-progress',
      { jobId: job.id },
      'PRIVATE',
    );
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-progress',
      { jobId: job.id },
      'AMS',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    if (job.attemptsMade < 3) {
      job.retry();
    } else {
      this.dlqqueue.add('failed-job', { ...job.data });
      this.crawlerWebsiteRepository.update(
        { id: job.data.crawlerId },
        { status: CrawlerStatus.FAILED },
      );

      await this.SsePublisherService.notifyUser(
        job.data.userId,
        'crawl-job-failed',
        { jobId: job.id },
        'PRIVATE',
      );
      await this.SsePublisherService.notifyUser(
        job.data.userId,
        'ams-crawl-job-failed',
        { jobId: job.id },
        'AMS',
      );

      this.eventEmitter.emit('crawler.failed', { jobData: job.data, error: error.message });
      console.error(` Job ${job.id} falhou: ${error.message}`);
    }
  }

  @OnWorkerEvent('stalled')
  async onStalled(job: Job) {
    console.warn(`Job ${job.id} ficou 'stalled' (possível crash do processo)`);
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-stalled',
      { jobId: job.id },
      'PRIVATE',
    );
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-stalled',
      { jobId: job.id },
      'AMS',
    );
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job, result: any) {
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-completed',
      { jobId: job.id },
      'PRIVATE',
    );
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-completed',
      { jobId: job.id },
      'AMS',
    );
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'global-crawl-job-completed',
      { jobId: job.id },
      'GLOBAL',
    );

    console.log(`Job ${job.id} terminou com sucesso! Resultado:`, result);
  }

  @OnWorkerEvent('drained')
  async onDrained() {
    await this.SsePublisherService.notifyUser(0, 'ams-crawl-job-drained', {}, 'AMS');

    console.log('All jobs have been processed and the queue is now empty.');
  }

  @OnWorkerEvent('paused')
  onPaused() {
    console.log('Queue has been paused.');
  }

  @OnWorkerEvent('resumed')
  onResumed() {
    console.log('Queue has been resumed.');
  }
}
