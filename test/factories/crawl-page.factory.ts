import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { CrawlerPage } from "src/domains/audit-engine/discovery/crawler-page/crawler-page.entity";
import { CrawlerWebsite } from "src/domains/audit-engine/discovery/crawler-website/entities/crawler-website.entity";
interface PageTransient {
  baseUri?: string;
  crawlWebsite?: CrawlerWebsite;
}
export const crawlPageFactory = Factory.define<CrawlerPage, PageTransient>(
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
    } as CrawlerPage;
  },
);
