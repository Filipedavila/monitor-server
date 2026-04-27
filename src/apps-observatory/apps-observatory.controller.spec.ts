import { Test, TestingModule } from "@nestjs/testing";
import { AppsObservatoryController } from "./apps-observatory.controller";

describe("Apps Observatory Controller", () => {
  let controller: AppsObservatoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsObservatoryController],
    }).compile();

    controller = module.get<AppsObservatoryController>(AppsObservatoryController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
