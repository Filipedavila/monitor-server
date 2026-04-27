import { Test, TestingModule } from "@nestjs/testing";
import { AppsEvaluationService } from "./apps-evaluation.service";

describe("AppsEvaluationService", () => {
  let service: AppsEvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppsEvaluationService],
    }).compile();

    service = module.get<AppsEvaluationService>(AppsEvaluationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
