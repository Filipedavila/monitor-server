import { Test, TestingModule } from "@nestjs/testing";
import { AppsAuthService } from "./apps-auth.service";

describe("AppsAuthService", () => {
  let service: AppsAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppsAuthService],
    }).compile();

    service = module.get<AppsAuthService>(AppsAuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
