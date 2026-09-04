import { Injectable } from '@nestjs/common';
import puppeteer, { BrowserContext } from 'puppeteer';
import { IWebsiteScraper } from '../types/scraper.interface';
import { UrlNormalizer } from '../url-normalizer';

@Injectable()
export class PuppeteerWebsiteScraperAdapter implements IWebsiteScraper {
  async scrapeWebsite(baseUrl: string): Promise<string[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--ignore-certificate-errors'],
    });

    const context: BrowserContext = await browser.createBrowserContext();
    try {
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

      const rawHrefs = await page.evaluate(() => {
        const links = document.querySelectorAll('body a');
        return Array.from(links)
          .map((link) => link.getAttribute('href'))
          .filter((href): href is string => href !== null);
      });

      return UrlNormalizer.filterAndNormalize(rawHrefs, baseUrl);
    } catch {
      return [];
    } finally {
      await context.close();
      await browser.close();
    }
  }
}
