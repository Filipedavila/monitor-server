import { Test, TestingModule } from "@nestjs/testing";
import { DiscoveryController } from "./discovery.controller";
import { CrawlerService } from "../services/discovery.service";
import { AuthGuard } from "@nestjs/passport";
import { ADMIN_USER_TYPE_ID } from "src/common/constants/roles.constants";

describe("CrawlerController", () => {
  let controller: DiscoveryController;
  let service: CrawlerService;

  // Mock do Service
  const mockCrawlerService = {
    getMany: jest.fn(),
    crawlWebsites: jest.fn(),
    getCrawlResults: jest.fn(),
    getCrawlPages: jest.fn(),
    deleteCrawlerPages: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscoveryController],
      providers: [
        {
          provide: CrawlerService,
          useValue: mockCrawlerService,
        },
      ],
    })
      .overrideGuard(AuthGuard("jwt-admin"))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard("jwt-monitor"))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DiscoveryController>(DiscoveryController);
    service = module.get<CrawlerService>(CrawlerService);

    jest.clearAllMocks();
  });

  describe("getCrawlWebsites", () => {
    it("should call service.getMany with query params", async () => {
      const query = { filters: {}, pagination: { page: 1, limit: 10 } } as any;
      mockCrawlerService.getMany.mockResolvedValue({ data: [], count: 0 });

      const result = await controller.getCrawlWebsites(query);

      expect(service.getMany).toHaveBeenCalledWith(query);
      expect(result).toEqual({ data: [], count: 0 });
    });
  });

  describe("crawlWebsite POST", () => {
    it("should extract user data and call service.crawlWebsites", async () => {
      // Arrange
      const mockReq = {
        user: { userId: 1, userType: ADMIN_USER_TYPE_ID },
      } as any;
      const dto = {
        websites: [10, 20],
        maxDepth: 3,
        maxPages: 100,
        waitJS: 1,
      } as any;

      // Act
      await controller.crawlWebsite(mockReq, dto);

      // Assert
      expect(service.crawlWebsites).toHaveBeenCalledWith(
        mockReq.user.userType,
        mockReq.user.userId,
        dto.websites,
        {
          maxDepth: dto.maxDepth,
          maxPages: dto.maxPages,
          waitJS: dto.waitJS,
        },
      );
    });
  });

  describe("deleteCrawl (DELETE)", () => {
    it("should return service result and have NO_CONTENT status behavior", async () => {
      const dto = { ids: [1, 2, 3] };
      mockCrawlerService.delete.mockResolvedValue({ affected: 3 });

      const result = await controller.deleteCrawl(dto);

      expect(service.delete).toHaveBeenCalledWith(dto.ids);
      expect(result).toEqual({ affected: 3 });
    });
  });

  describe("getCrawlPages (GET)", () => {
    it("should call getCrawlResults with correct userId and crawlerId", async () => {
      const mockReq = { user: { userId: 5 } } as any;
      const queryDto = { crawlerId: 100 };

      await controller.getCrawlPages(mockReq, queryDto);

      expect(service.getCrawlPages).toHaveBeenCalledWith(5, 100);
    });
  });
});
