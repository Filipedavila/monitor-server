import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IWebsiteScraper } from '../types/scraper.interface';
import { Inject } from '@nestjs/common';
import { SsePublisherService } from '../../../../../core/sse/sse-publisher.service';
import { In } from 'typeorm';

@Processor('crawl-queue-public')
export class CrawlPublicWorker extends WorkerHost {
  constructor(
    @Inject(IWebsiteScraper)
    private readonly websiteScraper: IWebsiteScraper,

    private readonly SsePublisherService: SsePublisherService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {

    switch (job.name) {
      case 'crawl-job':
        console.log('Processing crawl job for websiteId:', job.data.websiteId);
        await this.websiteScraper.scrapeWebsite(job.data.websiteId);

      default:
        throw new Error(`No handler for job ${job.name}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {}

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    console.log(`Job ${job.id} está em ${progress}%`);

  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} falhou. Erro:`, error);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    console.warn(`Job ${jobId} ficou 'stalled' (possível crash do processo)`);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job, result: any) {
    await this.SsePublisherService.notifyUser(job.data.userId,'crawl-job-completed', { jobId: job.id}, 'PRIVATE');
    await this.SsePublisherService.notifyUser(job.data.userId,'ams-crawl-job-completed', { jobId: job.id}, 'AMS');
        await this.SsePublisherService.notifyUser(job.data.userId,'global-crawl-job-completed', { jobId: job.id}, 'GLOBAL');



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
