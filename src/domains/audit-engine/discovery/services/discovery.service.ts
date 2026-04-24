import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CrawlWebsite } from "../entities/crawler-website.entity";
import { readFileSync, writeFileSync } from "fs";
import { CrawlerPageRepository } from "../repositories/crawler-page.repository";
import { CrawlerWebsiteRepository } from "../repositories/crawler-website.repository";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ADMIN_USER_TYPE_ID } from "src/common/constants/roles.constants";
import { WebsiteService } from "src/domains/inventory/website/website.service";
import {
  CrawlWebsiteResponseDTO,
  CrawlWebsitesResponseDTO,
} from "../dto/crawler-website-response.dto";
import { plainToInstance } from "class-transformer";
import { EventEmitter2 } from "eventemitter2";
import { CrawlerWebsiteRequestDTO } from "../dto/request/cralwer-website-request.dto";
import { BaseService } from "src/common/services/base.service";
import puppeteer, { BrowserContext } from "puppeteer";
import { CrawlPage } from "../entities/crawler-page.entity";

@Injectable()
export class CrawlerService extends BaseService {
  constructor(
    private readonly crawlPageRepository: CrawlerPageRepository,
    private readonly crawlWebsiteRepository: CrawlerWebsiteRepository,
    private readonly websiteService: WebsiteService,
    private readonly eventEmitter: EventEmitter2,

    @InjectQueue("crawl-queue-private") private crawlQueuePrivate: Queue,
    @InjectQueue("crawl-queue-public") private crawlQueuePublic: Queue,
  ) {
    super("CrawlerService");
  }

  async getOne(crawlWebsiteId: number): Promise<CrawlWebsiteResponseDTO> {
    const crawlWebsite =
      await this.crawlWebsiteRepository.findById(crawlWebsiteId);
    if (!crawlWebsite) {
      throw new NotFoundException("Crawl website not found");
    }
    return plainToInstance(CrawlWebsiteResponseDTO, crawlWebsite, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async getMany(
    query: CrawlerWebsiteRequestDTO,
  ): Promise<CrawlWebsitesResponseDTO> {
    const sorting = query.sorts?.sort;
    const filters = query.filters;
    const pagination = query.pagination;
    const websitesCrawled = await this.crawlWebsiteRepository.find({
      filters,
      sorting,
      pagination,
    });
    const responseDtos = plainToInstance(
      CrawlWebsiteResponseDTO,
      websitesCrawled.data,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    );
    return {
      data: responseDtos,
      count: websitesCrawled.count,
    };
  }

  async deleteCrawler(userId: number, websiteId: number): Promise<boolean> {
    try {
      const result =
        await this.crawlWebsiteRepository.deleteByUserIdAndWebsiteId(
          userId,
          websiteId,
        );
      return result;
    } catch (err) {
      return false;
    }
  }

  async crawlWebsites(
    userType: number,
    userId: number,
    websitesIds: number[],
    options?: {
      maxDepth?: number;
      maxPages?: number;
      waitJS?: number;
      tag?: number;
    },
  ): Promise<void> {
    this.logger.log(
      `Initiating crawl for userId: ${userId} with websites: ${websitesIds.join(", ")} and options: ${JSON.stringify(options)}`,
    );

    const websiteIds = websitesIds
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));
    if (websiteIds.length === 0) {
      this.logger.warn(
        `No valid website IDs provided for userId: ${userId}. Provided IDs: ${websitesIds.join(", ")}`,
      );
      throw new BadRequestException("No valid website IDs provided");
    }
    const websiteObjs = await this.websiteService.getWebsitesByIds(websiteIds);

    const entities = websiteObjs.map((obj) => {
      const newCrawlWebsite = new CrawlWebsite();
      newCrawlWebsite.websiteId = obj.id;
      newCrawlWebsite.baseUrl = obj.baseUrl;
      newCrawlWebsite.tagId = options.tag;
      newCrawlWebsite.createdById = userId;
      return newCrawlWebsite;
    });

    const savedCrawls = await this.crawlWebsiteRepository.saveMany(entities);

    const queue =
      userType === ADMIN_USER_TYPE_ID
        ? this.crawlQueuePrivate
        : this.crawlQueuePublic;

    // TODO: Decide on the schemma of the data sent to the worker and refactor accordingl
    const jobs = savedCrawls.map((crawl) => ({
      name: "crawl-job",
      data: {
        websiteId: crawl.websiteId,
        userId: userId,
        ...options,
      },
    }));

    await queue.addBulk(jobs);

    this.eventEmitter.emit("crawler.created", userId);
    this.logger.log(
      `Crawl jobs added to queue for userId: ${userId} with crawlWebsiteIds: ${savedCrawls.map((c) => c.id).join(", ")}`,
    );
  }

  async getCrawlPages(userId: number, crawlWebsiteId: number): Promise<any> {
    if (!crawlWebsiteId) {
      throw new BadRequestException("Crawl website id must be provided");
    }
    const pages = await this.crawlPageRepository.find({
      filters: { ids: [crawlWebsiteId] },
    });
    return pages;
  }

  async delete(crawlWebsiteIds: number[]): Promise<any> {
    if (!crawlWebsiteIds?.length) {
      throw new BadRequestException(
        "No crawl website id provided for deletion",
      );
    }
    const result =
      await this.crawlWebsiteRepository.deleteMany(crawlWebsiteIds);
    if (result.affected === 0) {
      throw new InternalServerErrorException("Failed to delete crawl website");
    }
    this.eventEmitter.emit("crawler.deleted", crawlWebsiteIds);
    return result;
  }

  async deleteCrawlerPages(
    userId: number,
    crawlWebsiteId: number,
    urls: string[],
  ): Promise<boolean> {
    //TODO: first check RBAC with CASL if has Permission
    const filter: Record<string, any> = {};
    if (crawlWebsiteId != null) filter.ids = crawlWebsiteId;
    if (urls?.length) filter.urls = urls;
    if (!crawlWebsiteId && (!urls || urls.length === 0)) {
      throw new BadRequestException(
        "Crawl website id and urls must be provided for deletion",
      );
    }
    const crawlPages = await this.crawlPageRepository.find({ filters: filter });
    if (!crawlPages.count) {
      throw new NotFoundException(
        "No crawl pages found for the given criteria",
      );
    }
    const crawlPageIds = crawlPages.data.map((page) => page.id);
    const result = await this.crawlPageRepository.deleteMany(crawlPageIds);
    if (result && result.affected) {
      return result.affected > 0;
    } else {
      throw new InternalServerErrorException("Failed to delete crawl pages");
    }
  }

  public async handleCrawl(crawlerWebsiteId: number) {
    const website =
      await this.crawlWebsiteRepository.findById(crawlerWebsiteId);
    if (!website) {
      return;
    }
    const urls = await this.startCrawlerWebsite(website);
    // TODO , undertsant the logic with tag
    if (!website.tagId) {
      for (const url of urls || []) {
        try {
          const newCrawlPage = new CrawlPage();
          newCrawlPage.url = decodeURIComponent(url);
          newCrawlPage.crawlWebsiteId = crawlerWebsiteId;

          await this.crawlPageRepository.save(newCrawlPage);
        } catch (e) {
          console.log(e);
        }
      }
      website.isDone = true;
      const websiteCrawled = await this.crawlWebsiteRepository.save(website);
      const responseDto = plainToInstance(
        CrawlWebsiteResponseDTO,
        websiteCrawled,
        { excludeExtraneousValues: true, enableImplicitConversion: true },
      );
      this.eventEmitter.emit(
        "crawler.finished",
        website.createdBy,
        responseDto,
      );
    }
  }

  private async startCrawlerWebsite(website: CrawlWebsite) {
    console.log("Starting crawl for websiteId:", website.id);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--ignore-certificate-errors"],
    });
    console.log("Browser launched for websiteId:", website.id);

    const incognito: BrowserContext = await browser.createBrowserContext();
    const urls = await this.MSCrawl(incognito, website.baseUrl);
    await incognito.close();
    await browser.close();

    return urls;
  }

  private async MSCrawl(
    browser: BrowserContext,
    pageURL: string,
  ): Promise<string[]> {
    try {
      const page = await browser.newPage();
      await page.goto(pageURL, { waitUntil: "domcontentloaded" });
      const urls = await page.evaluate(
        (pageURL) => {
          const notHtml =
            "css|jpg|jpeg|gif|svg|pdf|docx|js|png|ico|xml|mp4|mp3|mkv|wav|rss|json|pptx|txt|zip".split(
              "|",
            );
          const links = document.querySelectorAll("body a");
          const urls = new Array<string>();
          links.forEach((link: Element) => {
            if (link.hasAttribute("href")) {
              let href = link.getAttribute("href");
              if (href) {
                href = href.trim();
              } else {
                return;
              }
              if (href.startsWith("//")) {
                href = href.replace("//", "https://");
              }
              if (
                (href.startsWith(pageURL) ||
                  href.startsWith("/") ||
                  href.startsWith("./") ||
                  (!href.startsWith("http") && !href.startsWith("#"))) &&
                !href.includes("mailto:") &&
                !href.includes("tel:") &&
                !href.includes("javascript:")
              ) {
                let valid = true;
                for (const not of notHtml || []) {
                  if (
                    href.toLowerCase().endsWith(not) ||
                    href.toLowerCase().includes("." + not + "/")
                  ) {
                    valid = false;
                    break;
                  }
                  const parts = href.split("/");
                  if (parts.length > 0) {
                    const lastPart = parts[parts.length - 1];
                    if (lastPart.startsWith("#")) {
                      valid = false;
                      break;
                    }
                  }
                }
                if (valid) {
                  let correctUrl = "";
                  if (href.startsWith(pageURL)) {
                    correctUrl = href;
                  } else if (href.startsWith("./")) {
                    correctUrl = pageURL + href.slice(2);
                  } else if (href.startsWith("/")) {
                    correctUrl = pageURL + href.slice(1);
                  } else {
                    correctUrl = pageURL + href;
                  }
                  if (!urls.includes(correctUrl)) {
                    urls.push(correctUrl);
                  }
                }
              }
            }
          });
          return urls;
        },
        pageURL.endsWith("/") ? pageURL : pageURL + "/",
      );
      return urls;
    } catch (e) {
      console.log("Problem during crawling", e);
      return [];
    }
  }
}
