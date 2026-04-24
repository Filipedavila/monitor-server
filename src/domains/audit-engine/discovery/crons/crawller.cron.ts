import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class CrawlerCron {
  constructor() {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    // TODO
    //await this.crawlQueue.add('crawl-job', { websiteId: 1 });
  }
}
