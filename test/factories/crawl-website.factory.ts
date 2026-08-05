import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { CrawlerWebsite } from "src/domains/audit-engine/discovery/crawler-website/entities/crawler-website.entity";
export const crawlWebsiteFactory = Factory.define<CrawlerWebsite>(
  ({ sequence, transientParams, onCreate }) => {
    onCreate(async (website) => {
      return website;
    });

    return {
      id: sequence,
      createdBy: faker.number.int({ min: 1, max: 100 }),
      websiteId: transientParams.websiteId || 1,
      website: transientParams.website || null,
      baseUrl: faker.internet.url(),
      maxDepth: faker.number.int({ min: 1, max: 10 }),
      isDone: false,
      tagId: false,
      ownerRoleId: faker.number.int({ min: 1, max: 100 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    } as CrawlerWebsite;
  },
);
