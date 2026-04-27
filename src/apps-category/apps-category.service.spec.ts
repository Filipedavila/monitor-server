import { Test, TestingModule } from "@nestjs/testing";
import { AppsCategoryService } from "./apps-category.service";

describe("AppsCategoryService", () => {
  let service: AppsCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppsCategoryService],
    }).compile();

    service = module.get<AppsCategoryService>(AppsCategoryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
