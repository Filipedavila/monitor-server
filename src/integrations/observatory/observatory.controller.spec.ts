import { Test, TestingModule } from "@nestjs/testing";
import { ObservatoryController } from "./observatory.controller";
import { AppLoggerService } from "../../shared/services/app-logger.service";

describe("Observatory Controller", () => {
  let controller: ObservatoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservatoryController],
      providers: [
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ObservatoryController>(ObservatoryController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
