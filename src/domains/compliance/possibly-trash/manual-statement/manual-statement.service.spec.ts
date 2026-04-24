import { Test, TestingModule } from "@nestjs/testing";
import { ManualStatementService } from "./manual-statement.service";

describe("ManualEvaluationService", () => {
  let service: ManualStatementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualStatementService],
    }).compile();

    service = module.get<ManualStatementService>(ManualStatementService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
