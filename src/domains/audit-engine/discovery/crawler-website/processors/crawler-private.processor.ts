import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IWebsiteScraper } from '../types/scraper.interface';
import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CrawlerStatus, CrawlerWebsite } from '../entities/crawler-website.entity';
import { CrawlWebsiteHandler } from '../handlers/crawl-websites.handler';
import { InjectRepository } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';

@Processor('crawl-queue-private')
export class CrawlPrivateWorker extends WorkerHost {
  constructor(
    private readonly CrawlWebsiteHandler: CrawlWebsiteHandler,
    @InjectQueue(QUEUE_NAMES.CRAWL_PRIVATE_DQL)
    private readonly dlqqueue: Queue,
    @InjectRepository(CrawlerWebsite)
    private readonly crawlerWebsiteRepository: Repository<CrawlerWebsite>,
    private readonly eventEmitter: EventEmitter2,
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
  onActive(job: Job) {}

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    console.log(`Job ${job.id} está em ${progress}%`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    if (job.attemptsMade < 3) {
      job.retry();
    } else {
      this.dlqqueue.add('failed-job', { ...job.data });
      this.crawlerWebsiteRepository.update(
        { id: job.data.crawlerId },
        { status: CrawlerStatus.FAILED },
      );
      this.eventEmitter.emit('crawler.failed', { jobData: job.data, error: error.message });
      console.error(` Job ${job.id} falhou: ${error.message}`);
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    console.warn(`Job ${jobId} ficou 'stalled' (possível crash do processo)`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    console.log(`Job ${job.id} terminou com sucesso! Resultado:`, result);
  }

  @OnWorkerEvent('drained')
  onDrained() {
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
