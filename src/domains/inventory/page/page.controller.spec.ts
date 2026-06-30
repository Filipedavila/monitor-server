import { Test, TestingModule } from "@nestjs/testing";
import { PageController } from "./page.controller";

describe("Page Controller", () => {
  let controller: PageController;
  const mockPageService = {
    getPageData: jest.fn().mockResolvedValue({}),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageController],
      providers: [
        {
          provide: "PageService",
          useValue: mockPageService,
        },
      ],
    }).compile();

    controller = module.get<PageController>(PageController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
