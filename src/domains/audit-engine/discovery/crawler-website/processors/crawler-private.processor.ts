import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { IWebsiteScraper } from "../scrapers/scraper.interface";
import { Inject } from "@nestjs/common";

@Processor("crawl-queue-private")
export class CrawlPrivateWorker extends WorkerHost {
  constructor(
    @Inject(IWebsiteScraper)
    private readonly websiteScraper: IWebsiteScraper) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case "crawl-job":
        console.log("Processing crawl job for websiteId:", job.data.websiteId);
        await this.websiteScraper.scrapeWebsite(job.data.websiteId);


      default:
        throw new Error(`No handler for job ${job.name}`);
    }
  }

  @OnWorkerEvent("active")
  onActive(job: Job) {}

  @OnWorkerEvent("progress")
  onProgress(job: Job, progress: number | object) {
    console.log(`Job ${job.id} está em ${progress}%`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} falhou. Erro:`, error);
  }

  @OnWorkerEvent("stalled")
  onStalled(jobId: string) {
    console.warn(`Job ${jobId} ficou 'stalled' (possível crash do processo)`);
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job, result: any) {
    console.log(`Job ${job.id} terminou com sucesso! Resultado:`, result);
  }

  @OnWorkerEvent("drained")
  onDrained() {
    console.log("All jobs have been processed and the queue is now empty.");
  }

  @OnWorkerEvent("paused")
  onPaused() {
    console.log("Queue has been paused.");
  }

  @OnWorkerEvent("resumed")
  onResumed() {
    console.log("Queue has been resumed.");
  }
}
