import { Test, TestingModule } from "@nestjs/testing";
import { AppsEntityService } from "./apps-entity.service";

describe("AppsEntityService", () => {
  let service: AppsEntityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppsEntityService],
    }).compile();

    service = module.get<AppsEntityService>(AppsEntityService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
