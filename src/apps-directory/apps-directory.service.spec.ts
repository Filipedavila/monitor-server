import { Test, TestingModule } from "@nestjs/testing";
import { AppsDirectoryService } from "./apps-directory.service";

describe("AppsDirectoryService", () => {
  let service: AppsDirectoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppsDirectoryService],
    }).compile();

    service = module.get<AppsDirectoryService>(AppsDirectoryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
