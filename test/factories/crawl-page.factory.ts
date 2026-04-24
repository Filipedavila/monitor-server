import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { CrawlPage } from "src/domains/audit-engine/discovery/entities/crawler-page.entity";
import { CrawlWebsite } from "src/domains/audit-engine/discovery/entities/crawler-website.entity";
interface PageTransient {
  baseUri?: string;
  crawlWebsite?: CrawlWebsite;
}
export const crawlPageFactory = Factory.define<CrawlPage, PageTransient>(
  ({ sequence, transientParams, onCreate }) => {
    onCreate(async (page) => {
      return page;
    });
    const baseUri =
      transientParams.baseUri || faker.internet.url().replace(/\/$/, "");
    const randomPath = faker.lorem.word();
    const uniqueUri = `${baseUri}/${randomPath}-${sequence}`;
    return {
      id: sequence,
      crawlWebsite: transientParams.crawlWebsite || null,
      url: uniqueUri,
    } as CrawlPage;
  },
);
