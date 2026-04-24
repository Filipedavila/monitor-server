import { Test, TestingModule } from "@nestjs/testing";
import { AutomaticStatementService } from "./automatic-statement.service";

describe("AutomaticEvaluationService", () => {
  let service: AutomaticStatementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutomaticStatementService],
    }).compile();

    service = module.get<AutomaticStatementService>(
      AutomaticStatementService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
