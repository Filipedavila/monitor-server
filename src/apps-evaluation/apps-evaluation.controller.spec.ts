import { Test, TestingModule } from "@nestjs/testing";
import { AppsEvaluationController } from "./apps-evaluation.controller";

describe("Apps Evaluation Controller", () => {
  let controller: AppsEvaluationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsEvaluationController],
    }).compile();

    controller = module.get<AppsEvaluationController>(AppsEvaluationController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
