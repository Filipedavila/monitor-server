import { Test, TestingModule } from "@nestjs/testing";
import { AppsCategoryController } from "./apps-category.controller";

describe("Apps Category Controller", () => {
  let controller: AppsCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsCategoryController],
    }).compile();

    controller = module.get<AppsCategoryController>(AppsCategoryController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
