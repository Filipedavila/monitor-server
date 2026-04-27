import { Test, TestingModule } from "@nestjs/testing";
import { AppsEntityController } from "./apps-entity.controller";

describe("Apps Entity Controller", () => {
  let controller: AppsEntityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsEntityController],
    }).compile();

    controller = module.get<AppsEntityController>(AppsEntityController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
