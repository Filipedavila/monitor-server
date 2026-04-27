import { Test, TestingModule } from "@nestjs/testing";
import { AppsAuthController } from "./apps-auth.controller";

describe("Apps Auth Controller", () => {
  let controller: AppsAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsAuthController],
    }).compile();

    controller = module.get<AppsAuthController>(AppsAuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
