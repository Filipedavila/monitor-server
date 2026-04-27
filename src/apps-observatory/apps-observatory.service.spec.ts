import { Test, TestingModule } from "@nestjs/testing";
import { AppsObservatoryService } from "./apps-observatory.service";

describe("AppsObservatoryService", () => {
  let service: AppsObservatoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppsObservatoryService],
    }).compile();

    service = module.get<AppsObservatoryService>(AppsObservatoryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
