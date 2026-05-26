import { Test, TestingModule } from "@nestjs/testing";
import { AutomaticEvaluationController } from "./automatic-evaluation.controller";
import { AutomaticStatementService } from "./automatic-statement.service";

describe("AutomaticEvaluationController", () => {
  let controller: AutomaticEvaluationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomaticEvaluationController],
      providers: [AutomaticStatementService],
    }).compile();

    controller = module.get<AutomaticEvaluationController>(
      AutomaticEvaluationController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
