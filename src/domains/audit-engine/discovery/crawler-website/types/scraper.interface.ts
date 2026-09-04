export interface IWebsiteScraper {
  scrapeWebsite(baseUrl: string): Promise<string[]>;
}

export const IWebsiteScraper = Symbol('IWebsiteScraper');
