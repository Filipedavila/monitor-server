import { TestingModule } from "@nestjs/testing";
import { StartedMySqlContainer } from "@testcontainers/mysql";
import {
  CrawlerPageRepository,
  PageCrawlerFilter,
  PageCrawlerSorting,
} from "./crawler-page.repository";
import { TestDatabaseManager } from "src/common/tests/test-container";
import { crawlPageFactory } from "test/factories/crawl-page.factory";
import { crawlWebsiteFactory } from "test/factories/crawl-website.factory";
import { CrawlerWebsiteRepository } from "./crawler-website.repository";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { getAllEntities } from "src/data-source";

describe("Crawler Page Repository", () => {
  let module: TestingModule;
  let pageRepository: CrawlerPageRepository;
  let websiteRepository: CrawlerWebsiteRepository;
  let manager: TestDatabaseManager;

  beforeAll(async () => {
    try {
      manager = await TestDatabaseManager.create({
        entities: getAllEntities(),
        providers: [
          CrawlerPageRepository,
          CrawlerWebsiteRepository,
          AppLoggerService,
        ],
        imports: [],
      });

      module = manager.getModule();
      pageRepository = module.get<CrawlerPageRepository>(CrawlerPageRepository);
      websiteRepository = module.get<CrawlerWebsiteRepository>(
        CrawlerWebsiteRepository,
      );
    } catch (e) {
      console.error("FATAL ERROR IN BEFOREALL:", e);
      throw e;
    }
  }, 70000);

  afterEach(async () => {
    await pageRepository.query("DELETE FROM crawl_pages");
    await websiteRepository.query("DELETE FROM crawl_websites");
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (manager) {
      await manager.cleanup();
    }
  });

  it("should be defined", () => {
    expect(pageRepository).toBeDefined();
  });

  it("should create crawl page and find it", async () => {
    //arrange
    const user = manager.getTestUser("ADMIN");
    const crawlWebsite = crawlWebsiteFactory.build({
      createdBy: user.id,
      updatedBy: user.id,
    });
    const savedWebsite = await websiteRepository.save(crawlWebsite);
    const crawlPage = crawlPageFactory.build({
      id: savedWebsite.id,
      url: savedWebsite.baseUrl,
    });
    //act
    const savedPage = await pageRepository.save(crawlPage);
    const foundPages = await pageRepository.find({
      filters: { crawlerWebsiteId: savedPage.id },
    });
    //assert

    expect(Array.isArray(foundPages.data)).toBe(true);
    expect(foundPages.count).toBe(1);
    expect(foundPages.data[0].url).toBe(crawlPage.url);
  });

  it("should create many and find many paginated", async () => {
    //arrange
    const user = manager.getTestUser("ADMIN");
    const crawlWebsite = crawlWebsiteFactory.build({
      createdBy: user.id,
      updatedBy: user.id,
    });
    await websiteRepository.save(crawlWebsite);
    const pagesToCreate = crawlPageFactory
      .transient({ baseUri: crawlWebsite.baseUrl })
      .buildList(15, {
        crawlWebsite: { id: crawlWebsite.id },
      });
    await pageRepository.saveMany(pagesToCreate);

    //act
    const page1Result = await pageRepository.find({
      pagination: { page: 1, limit: 10 },
    });
    const page2Result = await pageRepository.find({
      pagination: { page: 2, limit: 10 },
    });
    const pageMaxCurrentPaginationResult = await pageRepository.find({
      pagination: { page: 1, limit: 20 },
    });
    const p1Ids = page1Result.data.map((p) => p.id);
    const p2Ids = page2Result.data.map((p) => p.id);
    const intersect = p1Ids.filter((id) => p2Ids.includes(id));
    //assert
    expect(Array.isArray(page1Result.data)).toBe(true);
    expect(page1Result.data.length).toBe(10);
    expect(page1Result.count).toBe(15);
    expect(Array.isArray(page2Result.data)).toBe(true);
    expect(page2Result.data.length).toBe(5);
    expect(page2Result.count).toBe(15);
    expect(Array.isArray(pageMaxCurrentPaginationResult.data)).toBe(true);
    expect(pageMaxCurrentPaginationResult.data.length).toBe(15);
    expect(pageMaxCurrentPaginationResult.count).toBe(15);
    expect(intersect).toHaveLength(0);
  });

  it("should filter pages by status and websiteId correctly", async () => {
    //  arrange
    const user = manager.getTestUser("ADMIN");
    const siteA = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    const siteB = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );

    await pageRepository.saveMany([
      ...crawlPageFactory.buildList(10, { crawlWebsite: { id: siteA.id } }),
      ...crawlPageFactory.buildList(5, { crawlWebsite: { id: siteA.id } }),
      ...crawlPageFactory.buildList(5, { crawlWebsite: { id: siteB.id } }),
    ]);

    //  act:
    const result = await pageRepository.find({
      filters: {
        crawlerWebsiteId: siteA.id,
      },
      pagination: { page: 1, limit: 20 },
    });

    // assert
    expect(result.count).toBe(15);
    expect(result.data).toHaveLength(15);

    result.data.forEach((page) => {
      expect(page.crawlWebsite.id).toBe(siteA.id);
    });
  });

  it("should sort pages by Uri in descending order", async () => {
    // 1. Arrange
    const user = manager.getTestUser("ADMIN");
    const site = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    await pageRepository.saveMany([
      crawlPageFactory.build({ crawlWebsiteId: site.id, url: "aaa.com" }),
      crawlPageFactory.build({ crawlWebsiteId: site.id, url: "ccc.com" }),
      crawlPageFactory.build({ crawlWebsiteId: site.id, url: "bbb.com" }),
    ]);

    // 2. Act: Sort DESC
    const result = await pageRepository.find({
      sorting: { url: "DESC" } as any,
      pagination: { page: 1, limit: 10 },
    });

    // 3. Assert: Order C -> B -> A
    expect(result.data[0].url).toBe("ccc.com");
    expect(result.data[1].url).toBe("bbb.com");
    expect(result.data[2].url).toBe("aaa.com");
  });

  it("should filter pages by url containing substring", async () => {
    // arrange
    const user = manager.getTestUser("ADMIN");
    const site = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    await pageRepository.saveMany([
      crawlPageFactory.build({
        crawlWebsiteId: site.id,
        url: "https://example.com/page1",
      }),
      crawlPageFactory.build({
        crawlWebsiteId: site.id,
        url: "https://example.com/page2",
      }),
      crawlPageFactory.build({
        crawlWebsiteId: site.id,
        url: "https://other.com/page",
      }),
    ]);

    // act
    const result = await pageRepository.find({
      filters: { url: "example.com" },
      pagination: { page: 1, limit: 10 },
    });

    // assert
    expect(result.count).toBe(2);
    expect(result.data).toHaveLength(2);
    result.data.forEach((page) => {
      expect(page.url).toContain("example.com");
    });
  });

  it("should filter pages by multiple urls", async () => {
    // arrange
    const user = manager.getTestUser("ADMIN");
    const site = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    await pageRepository.saveMany([
      crawlPageFactory.build({ crawlWebsiteId: site.id, url: "https://a.com" }),
      crawlPageFactory.build({ crawlWebsiteId: site.id, url: "https://b.com" }),
      crawlPageFactory.build({ crawlWebsiteId: site.id, url: "https://c.com" }),
    ]);

    // act
    const result = await pageRepository.find({
      filters: { urls: ["https://a.com", "https://c.com"] },
      pagination: { page: 1, limit: 10 },
    });

    // assert
    expect(result.count).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((p) => p.url)).toEqual(
      expect.arrayContaining(["https://a.com", "https://c.com"]),
    );
  });

  it("should filter pages by multiple ids", async () => {
    // arrange
    const user = manager.getTestUser("ADMIN");
    const site = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    const pages = await pageRepository.saveMany([
      crawlPageFactory.build({ crawlWebsiteId: site.id }),
      crawlPageFactory.build({ crawlWebsiteId: site.id }),
      crawlPageFactory.build({ crawlWebsiteId: site.id }),
    ]);

    // act
    const result = await pageRepository.find({
      filters: { ids: [pages[0].id, pages[2].id] },
      pagination: { page: 1, limit: 10 },
    });

    // assert
    expect(result.count).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((p) => p.id)).toEqual(
      expect.arrayContaining([pages[0].id, pages[2].id]),
    );
  });

  it("should combine filters and sorting", async () => {
    // arrange
    const user = manager.getTestUser("ADMIN");
    const siteA = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    const siteB = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    await pageRepository.saveMany([
      crawlPageFactory.build({ crawlWebsiteId: siteA.id, url: "aaa.com" }),
      crawlPageFactory.build({ crawlWebsiteId: siteA.id, url: "ccc.com" }),
      crawlPageFactory.build({ crawlWebsiteId: siteB.id, url: "bbb.com" }),
    ]);

    // act
    const result = await pageRepository.find({
      filters: { crawlerWebsiteId: siteA.id },
      sorting: { url: "DESC" } as any,
      pagination: { page: 1, limit: 10 },
    });

    // assert
    expect(result.count).toBe(2);
    expect(result.data[0].url).toBe("ccc.com");
    expect(result.data[1].url).toBe("aaa.com");
  });

  it("should handle empty filter results", async () => {
    // arrange
    const user = manager.getTestUser("ADMIN");
    const site = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
      }),
    );
    await pageRepository.saveMany([
      crawlPageFactory.build({
        crawlWebsiteId: site.id,
        url: "https://example.com/page1",
      }),
      crawlPageFactory.build({
        crawlWebsiteId: site.id,
        url: "https://example.com/page2",
      }),
    ]);
    // act
    const result = await pageRepository.find({
      filters: { url: "nonexistent" },
      pagination: { page: 1, limit: 10 },
    });

    // assert
    expect(result.count).toBe(0);
    expect(result.data).toHaveLength(0);
  });
});
