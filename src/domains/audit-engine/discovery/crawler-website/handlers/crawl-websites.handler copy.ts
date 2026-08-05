import { Injectable } from "@nestjs/common";
import puppeteer, { BrowserContext } from "puppeteer";
import { CrawlerWebsite } from "../entities/crawler-website.entity";

@Injectable()
export class CrawlWebsiteHandler {
  private async startCrawlerWebsite(website: CrawlerWebsite) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--ignore-certificate-errors"],
    });

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
      return [];
    }
  }
}