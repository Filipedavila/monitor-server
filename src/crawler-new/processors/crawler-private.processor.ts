import { Processor, WorkerHost} from "@nestjs/bullmq";
import { Job } from 'bullmq';
import { CrawlPageNew, CrawlWebsiteNew } from "../crawler.entity";
import puppeteer, { BrowserContext } from "puppeteer";

import { WebsiteService } from "src/website/website.service";
import { CrawlerWebsiteRepository } from "../crawler-website.repository";
import { CrawlerPageRepository } from "../crawler-page.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { ADMIN_USER_ID } from "src/common/constants/roles.constants";

@Processor('crawl-queue-private') 
export class CrawlWorker extends WorkerHost {

    constructor(

    private readonly crawlPageRepository: CrawlerPageRepository,

    private readonly crawlWebsiteRepository: CrawlerWebsiteRepository,
   
  ) { super(); }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'crawl-job':
        console.log("Processing crawl job for websiteId:", job.data.websiteId);
        return await this.handleCrawl(job.data.websiteId);
      default:
        throw new Error(`No handler for job ${job.name}`);
    }
  }

  private async handleCrawl(websiteId: number) {;
    console.log("Handling crawl job for websiteId:", websiteId);
    const website = await this.crawlWebsiteRepository.findById(websiteId);
    if (!website) {
      console.log("Website not found for websiteId:", websiteId);
      return;
    }
    console.log("Crawl website found for websiteId:", websiteId);
    const urls = await this.startCrawlerWebsite(website);
    
                if (website.Tag !== 1) {
                  for (const url of urls || []) {
                    try {
                    
                      const newCrawlPage = new CrawlPageNew();
                      newCrawlPage.Uri = decodeURIComponent(url);
                      newCrawlPage.CrawlWebsiteId = website.CrawlWebsiteId;
                     
                      await this.crawlPageRepository.save(newCrawlPage);
                    
                    } catch (e) {
                      console.log(e);
                    }
                  }
    
  }
}

  private async startCrawlerWebsite(website: CrawlWebsiteNew) {
        console.log("Starting crawl for websiteId:", website.CrawlWebsiteId);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--ignore-certificate-errors"],
    });
    console.log("Browser launched for websiteId:", website.CrawlWebsiteId);

    const incognito: any = await browser.createBrowserContext();
    const urls = await this.MSCrawl(incognito, website.StartingUrl);
    await incognito.close();
    await browser.close();
    console.log("urls found for websiteId:", website.CrawlWebsiteId, urls);
    return urls;
  }

    private async MSCrawl(
      browser: BrowserContext,
      pageURL: string
    ): Promise<string[]> {
      try {
        const page = await browser.newPage();
        await page.goto(pageURL, { waitUntil: "domcontentloaded" });
        const urls = await page.evaluate(
          (pageURL) => {
            const notHtml =
              "css|jpg|jpeg|gif|svg|pdf|docx|js|png|ico|xml|mp4|mp3|mkv|wav|rss|json|pptx|txt|zip".split(
                "|"
              );
            const links = document.querySelectorAll("body a");
            const urls = new Array<string>();
            links.forEach((link: Element) => {
              if (link.hasAttribute("href")) {
                let href = link.getAttribute("href").trim();
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
                    if (href.endsWith(not) || href.includes("." + not + "/")) {
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
          pageURL.endsWith("/") ? pageURL : pageURL + "/"
        );
        return urls;
      } catch (e) {
        console.log("Problem during crawling", e);
        return [];
      }
    }
}