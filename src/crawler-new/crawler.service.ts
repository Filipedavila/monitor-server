import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, In } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CrawlPageNew, CrawlWebsiteNew } from "./crawler.entity";
import { readFileSync, writeFileSync } from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { PageService } from "src/page/page.service";
import { BrowserContext } from "puppeteer";
import { CrawlerPageRepository } from "./crawler-page.repository";
import { CrawlerWebsiteRepository } from "./crawler-website.repository";
import { InjectQueue, } from "@nestjs/bullmq";
import { Queue } from 'bullmq';
import { ADMIN_USER_ID } from "src/common/constants/roles.constants";
import { WebsiteService } from "src/website/website.service";


@Injectable()
export class CrawlerService {

  constructor(
    private readonly crawlPageRepository: CrawlerPageRepository,
    private readonly crawlWebsiteRepository: CrawlerWebsiteRepository,
    private readonly websiteService: WebsiteService,
    @InjectQueue('crawl-queue-private') private crawlQueuePrivate: Queue,
    @InjectQueue('crawl-queue-public') private crawlQueuePublic: Queue,
    
  ) {
  }

  getConfig(): any {
    const content = readFileSync(
      __dirname + "/../../public/crawlerConfig.json"
    );
    const config = JSON.parse(content.toString());
    return config;
  }

  // TODO should be saved in db and not in crawlerConfig.json

  setConfig(maxDepth: number, maxPages: number): any {
    writeFileSync(
      __dirname + "/../../public/crawlerConfig.json",
      JSON.stringify({ maxDepth, maxPages }, null, 2)
    );
    return true;
  }
  async getAll(): Promise<any> {
    const websites = await this.crawlWebsiteRepository.findAll();
    return websites;
  }
  async getCrawlWebsitesByUser(userId: number): Promise<any> {
    const websites = await this.crawlWebsiteRepository.findWebsites(userId, {});
    return websites;
  }

  
  async crawlTags(tagsId: number[]): Promise<void> {
  
      const websites = await this.crawlWebsiteRepository.findWebsites(
          ADMIN_USER_ID, { tagsId: tagsId });
      if (websites.length === 0) {
        throw new InternalServerErrorException('No websites found for the given tags');
      }

      this.crawlWebsites(ADMIN_USER_ID, websites);


  }

  async getUserTagWebsitesCrawlResults(
    userId: number,
    tagName: string
  ): Promise<any> {
    const websites = await this.crawlWebsiteRepository.findWebsites(userId, { tagName: tagName });
    return websites;
  }

  async deleteCrawler(userId: number, websiteId: number): Promise<boolean> {
    try {
      const result = await this.crawlWebsiteRepository.deleteByUserIdAndWebsiteId(userId, websiteId);  
      return result;
    } catch (err) {
      return false;
    }
  }

  async crawlWebsites(
    userId: number,
    websites: Array<any>,
    options?: {
      maxDepth?: number;
      maxPages?: number;
      waitJS?: number;
      tag?: number;
    }
  ): Promise<any> {
    // Add to worker queue
    for (const website of websites) {
      console.log("Adding crawl job for websiteId:", website);
      console.log("UserId:", userId);
      const websiteObj = await this.websiteService.getWebsiteById(website.CrawlWebsiteId);
      if (userId == ADMIN_USER_ID) {
        const newCrawlWebsite = createCrawlWebsite(websiteObj);
        const savedCrawlWebsite = await this.crawlWebsiteRepository.save(newCrawlWebsite);
        console.log("Crawl website saved for websiteId:", savedCrawlWebsite.CrawlWebsiteId);
      this.crawlQueuePrivate.add('crawl-job', {
        websiteId: savedCrawlWebsite.CrawlWebsiteId,
        userId: userId,
        ...options
      });
      
      } else {
         const newCrawlWebsite = createCrawlWebsite(websiteObj);
        newCrawlWebsite.UserId = userId;
        newCrawlWebsite.Creation_Date = new Date();
        const savedCrawlWebsite = await this.crawlWebsiteRepository.save(newCrawlWebsite);
        console.log("Crawl website saved for websiteId:", savedCrawlWebsite.CrawlWebsiteId);
        this.crawlQueuePublic.add('crawl-job', {
          websiteId: savedCrawlWebsite.CrawlWebsiteId,
          userId: userId,
          ...options
        });
      }
    }

    function createCrawlWebsite(websiteObj) {
      const newCrawlWebsite = new CrawlWebsiteNew();
      newCrawlWebsite.WebsiteId = websiteObj.WebsiteId;
      newCrawlWebsite.StartingUrl = websiteObj.StartingUrl;
      newCrawlWebsite.Tag = websiteObj.Tag;
      newCrawlWebsite.UserId = userId;
      newCrawlWebsite.Creation_Date = new Date();
      return newCrawlWebsite;
    }
  }
    

  async getCrawlResults(userId: number, crawlWebsiteId: number): Promise<any> {
    
    const pages = await this.crawlPageRepository.findCrawlPagesWithFilters(userId, crawlWebsiteId);  

    return pages;
  }

  async delete(crawlWebsiteId: number): Promise<any> {
      const result = await this.crawlWebsiteRepository.delete(crawlWebsiteId);
      if (result.affected === 0) {
        throw new InternalServerErrorException('Failed to delete crawl website');
      }
      return result;
  }

  async deleteBulk(crawlWebsiteIds: Array<number>): Promise<boolean> {
    const result = await this.crawlWebsiteRepository.deleteMany(crawlWebsiteIds);
    return result.affected > 0;
  }

}
