import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { EventEmitter2 } from "eventemitter2";
import { getQueueToken } from "@nestjs/bullmq";
import { CrawlerService } from "./discovery.service";
import { CrawlerPageRepository } from "../repositories/crawler-page.repository";
import { CrawlerWebsiteRepository } from "../repositories/crawler-website.repository";
import { WebsiteService } from "src/domains/inventory/website/website.service";
import { ADMIN_USER_TYPE_ID } from "@common/constants/roles.constants";
import { crawlWebsiteFactory } from "@factories/crawl-website.factory";

describe("CrawlerService Tests", () => {
  let service: CrawlerService;
  let websiteRepo: CrawlerWebsiteRepository;
  let pageRepo: CrawlerPageRepository;
  let websiteService: WebsiteService;
  let eventEmitter: EventEmitter2;
  let privateQueue: any;
  let publicQueue: any;

  const mockQueue = {
    addBulk: jest.fn().mockResolvedValue([]),
    add: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerService,
        {
          provide: CrawlerPageRepository,
          useValue: {
            findCrawlPagesWithFilters: jest.fn().mockResolvedValue([]),
            deleteMany: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: CrawlerWebsiteRepository,
          useValue: {
            find: jest.fn(),
            saveMany: jest.fn(),
            deleteByUserIdAndWebsiteId: jest.fn(),
            deleteMany: jest.fn(),
          },
        },
        { provide: WebsiteService, useValue: { getWebsitesByIds: jest.fn() } },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: getQueueToken("crawl-queue-private"),
          useValue: { addBulk: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getQueueToken("crawl-queue-public"),
          useValue: { addBulk: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
    websiteRepo = module.get(CrawlerWebsiteRepository);
    pageRepo = module.get(CrawlerPageRepository);
    websiteService = module.get(WebsiteService);
    eventEmitter = module.get(EventEmitter2);
    privateQueue = module.get(getQueueToken("crawl-queue-private"));
    publicQueue = module.get(getQueueToken("crawl-queue-public"));

    jest.clearAllMocks();
  });

  describe("crawlWebsites (Complex Logic & Queuing)", () => {
    const userId = 100;
    const websiteIds = [1, 2];
    const mockWebsites = crawlWebsiteFactory.buildList(2);

    it("should throw BadRequestException if websiteIds array is empty or invalid", async () => {
      await expect(
        service.crawlWebsites(1, userId, ["invalid"] as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should route to PRIVATE queue and emit event when user is ADMIN", async () => {
      jest
        .spyOn(websiteService, "getWebsitesByIds")
        .mockResolvedValue(mockWebsites as any);
      jest
        .spyOn(websiteRepo, "saveMany")
        .mockResolvedValue(mockWebsites as any);

      await service.crawlWebsites(ADMIN_USER_TYPE_ID, userId, websiteIds);

      expect(privateQueue.addBulk).toHaveBeenCalled();
      expect(publicQueue.addBulk).not.toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith("crawler.created", userId);
    });

    it("should route to PUBLIC queue when user is regular USER", async () => {
      jest
        .spyOn(websiteService, "getWebsitesByIds")
        .mockResolvedValue(mockWebsites as any);
      jest
        .spyOn(websiteRepo, "saveMany")
        .mockResolvedValue(mockWebsites as any);

      await service.crawlWebsites(999, userId, websiteIds); // Non-admin

      expect(publicQueue.addBulk).toHaveBeenCalled();
      expect(privateQueue.addBulk).not.toHaveBeenCalled();
    });
  });

  describe("getMany ", () => {
    it("should return paginated data mapped to Response DTOs", async () => {
      const entities = crawlWebsiteFactory.buildList(5);
      jest
        .spyOn(websiteRepo, "find")
        .mockResolvedValue({ data: entities, count: 5 } as any);

      const result = await service.getMany({
        filters: {},
        sorts: {},
        pagination: {},
      } as any);

      expect(result.count).toBe(5);
      expect(result.data).toHaveLength(5);

      expect(result.data[0].constructor.name).toBe("CrawlWebsiteResponseDTO");
    });
    it("should return valid DTO even if find returns more fields than DTO has", async () => {
      const entities = crawlWebsiteFactory
        .buildList(1)
        .map((entity) => ({ ...entity, extraField: "extraValue" }));
      jest
        .spyOn(websiteRepo, "find")
        .mockResolvedValue({ data: entities, count: 1 } as any);

      const result = await service.getMany({
        filters: {},
        sorts: {},
        pagination: {},
      } as any);

      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty("extraField");
    });

    it("should return empty data array and count 0", async () => {
      jest
        .spyOn(websiteRepo, "find")
        .mockResolvedValue({ data: [], count: 0 } as any);

      const result = await service.getMany({
        filters: {},
        sorts: {},
        pagination: {},
      } as any);

      expect(result.count).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe("delete Operations (Error Handling)", () => {
    it("deleteCrawlerPages: should throw NotFound if no pages match filters", async () => {
      jest.spyOn(pageRepo, "find").mockResolvedValue({ data: [], count: 0 });

      await expect(service.deleteCrawlerPages(1, 1, ["url"])).rejects.toThrow(
        NotFoundException,
      );
    });

    it("delete: should throw BadRequest if ids array is empty", async () => {
      await expect(service.delete([])).rejects.toThrow(BadRequestException);
    });

    it("delete: should throw InternalServerError if repository fails to delete", async () => {
      jest
        .spyOn(websiteRepo, "deleteMany")
        .mockResolvedValue({ affected: 0 } as any);

      await expect(service.delete([1, 2])).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("delete: should return affected count and emit event on success", async () => {
      jest
        .spyOn(websiteRepo, "deleteMany")
        .mockResolvedValue({ affected: 2 } as any);
      const result = await service.delete([1, 2]);

      expect(result.affected).toBe(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith("crawler.deleted", [1, 2]);
    });
  });

  describe("deleteCrawler (Graceful failure)", () => {
    it("should return false if repository throws error", async () => {
      jest
        .spyOn(websiteRepo, "deleteByUserIdAndWebsiteId")
        .mockRejectedValue(new Error());
      const result = await service.deleteCrawler(1, 1);
      expect(result).toBe(false);
    });
  });
});
