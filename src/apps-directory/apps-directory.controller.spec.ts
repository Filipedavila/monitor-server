import { Test, TestingModule } from "@nestjs/testing";
import { AppsDirectoryController } from "./apps-directory.controller";

describe("Apps Directory Controller", () => {
  let controller: AppsDirectoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsDirectoryController],
    }).compile();

    controller = module.get<AppsDirectoryController>(AppsDirectoryController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
