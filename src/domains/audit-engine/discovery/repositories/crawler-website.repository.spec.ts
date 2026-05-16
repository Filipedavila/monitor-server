import { TestingModule } from "@nestjs/testing";
import { TestDatabaseManager } from "src/common/tests/test-container";
import { crawlWebsiteFactory } from "test/factories/crawl-website.factory";
import { CrawlerWebsiteRepository } from "./crawler-website.repository";
import { CrawlerPageRepository } from "./crawler-page.repository";
import { crawlPageFactory } from "test/factories/crawl-page.factory";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { getAllEntities } from "src/data-source";

describe("Crawler Website Repository", () => {
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
    expect(websiteRepository).toBeDefined();
  });

  it("should create a website and find it by id", async () => {
    // Arrange
    const user = manager.getTestUser("ADMIN");
    const website = crawlWebsiteFactory.build({
      isDone: false,
      createdBy: user.id,
      updatedBy: user.id,
    });
    const saved = await websiteRepository.save(website);

    // Act
    const result = await websiteRepository.find({
      filters: { id: saved.id },
    });

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(saved.id);
  });

  it("should filter websites by done status", async () => {
    const user = manager.getTestUser("ADMIN");
    await websiteRepository.atomicSaveMany([
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
        isDone: true,
      }),
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
        isDone: true,
      }),
      crawlWebsiteFactory.build({
        createdBy: user.id,
        updatedBy: user.id,
        isDone: false,
      }),
    ]);

    // Act
    const result = await websiteRepository.find({
      filters: { isDone: true },
    });

    // Assert
    expect(result.count).toBe(2);
    result.data.forEach((ws) => expect(ws.isDone).toBe(true));
  });

  it("should find the next pending website by userId", async () => {
    // Arrange: Criar websites com datas diferentes
    const user = manager.getTestUser("ADMIN");
    const userId = user.id;
    await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: userId,
        updatedBy: userId,
        isDone: false,
        createdAt: new Date("2023-01-01"),
      }),
    );
    const moreRecent = await websiteRepository.save(
      crawlWebsiteFactory.build({
        createdBy: userId,
        updatedBy: userId,
        isDone: false,
        createdAt: new Date("2023-01-02"),
      }),
    );

    // Act
    const next = await websiteRepository.findNextPendingByUserId(userId);

    // Assert: Deve trazer o mais antigo (createdAt ASC)
    expect(next).toBeDefined();
    expect(next?.createdAt.toISOString()).toContain("2023-01-01");
  });

  it("should load relation count and map page counter", async () => {
    // Arrange: 1 Website com 5 páginas
    const user = manager.getTestUser("ADMIN");
    const crawlWebsite = crawlWebsiteFactory.build({
      createdBy: user.id,
      updatedBy: user.id,
    });
    const website = await websiteRepository.save(crawlWebsite);
    const pages = crawlPageFactory.buildList(5, { id: website.id });
    await pageRepository.saveMany(pages);

    // Act
    const results = await websiteRepository.findAllWithPageCounter();

    // Assert
    const found = results.find((w) => w.id === website.id);

    expect(found).toBeDefined();
    expect(found?.pageCount).toBe(5);
  });
});
