import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { IWebsiteScraper } from '../types/scraper.interface';
import { UrlNormalizer } from '../url-normalizer';
import { Crawler } from '@qualweb/crawler';

@Injectable()
export class WebsiteCrawlerAdapter implements IWebsiteScraper {
  async scrapeWebsite(baseUrl: string): Promise<string[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--ignore-certificate-errors'],
    });
    const viewport = {
      // check https://github.com/puppeteer/puppeteer/blob/v8.0.0/docs/api.md#pagesetviewportviewport
      width: 640,
      height: 480,
      deviceScaleFactor: 1,
    };
    const crawler = new Crawler(browser, baseUrl, viewport);

    const options = {
      maxDepth: 0, // max depth to search, 0 to search only the given domain. Default value = -1 (search everything)
      maxUrls: 100, // max urls to find. Default value = -1 (search everything)
      timeout: 30, // how many seconds the domain should be crawled before it ends. Default value = -1 (never stops)
      maxParallelCrawls: 5, // max urls to crawl at the same time. Default value = 5
      logging: false, // logs domain, current depth, urls found and time passed to the terminal
    };
    await crawler.crawl(options);

    await browser.close();

    const urls = crawler.getResults();
    const rawHrefs = urls;
    const normalizedHrefs = UrlNormalizer.filterAndNormalize(rawHrefs, baseUrl);
    return normalizedHrefs;
  }
}
