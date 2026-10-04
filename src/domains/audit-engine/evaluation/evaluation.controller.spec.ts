import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus } from "@nestjs/common";
import { EvaluationController } from "./evaluation.controller";
import { EvaluationService } from "./evaluation.service";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { Response } from "express";
import { createReadStream } from "node:fs";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { EventEmitter } from "events";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";

jest.mock("node:fs", () => ({
  createReadStream: jest.fn(),
}));


const mockUser: AuthenticatedUser = {
  id: 1,
  username: "admin@example.com",
  role_slug: RoleSlug.ADMIN,
};

function makeMockRes() {
  const res = {
    set: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    pipe: jest.fn(),
  } as unknown as Response;
  return res;
}


function makeFakeStream(shouldError = false) {
  const stream = new EventEmitter() as any;
  stream.pipe = jest.fn((dest: any) => {
    if (shouldError) {
      process.nextTick(() => stream.emit("error", new Error("read error")));
    }
    return dest;
  });
  return stream;
}


const mockEvaluationService = {
  getEvaluations: jest.fn(),
  getEvaluationById: jest.fn(),
  getEvaluationResultJson: jest.fn(),
  getEvaluationHtml: jest.fn(),
  saveExternalEvaluation: jest.fn(),
  evaluateWebsite: jest.fn(),
};

const mockAppLoggerService = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            setContext: jest.fn(),
          

}


describe("EvaluationController", () => {
  let controller: EvaluationController;

  beforeEach(async () => {
     const module: TestingModule = await Test.createTestingModule({
       controllers: [EvaluationController],
       providers: [
         { provide: EvaluationService, useValue: mockEvaluationService },
         { provide: AppLoggerService, useValue: mockAppLoggerService },
       ],
     })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
       .compile();

     controller = module.get<EvaluationController>(EvaluationController);
   });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe("findAllAMSEval", () => {
    it("should call getEvaluations with correct args and return result", async () => {
      const expected = [{ id: 1 }];
      const query = { status: "done" } as any;
      mockEvaluationService.getEvaluations.mockResolvedValue(expected);

      const result = await controller.findAllAMSEval(mockUser, 2, query);

      expect(mockEvaluationService.getEvaluations).toHaveBeenCalledWith(
        2,
        { user: mockUser },
        query,
      );
      expect(result).toEqual(expected);
    });

    it("should propagate service errors", async () => {
      mockEvaluationService.getEvaluations.mockRejectedValue(new Error("DB error"));

      await expect(controller.findAllAMSEval(mockUser, 1, {} as any)).rejects.toThrow("DB error");
    });
  });


  describe("findOne", () => {
    it("should call getEvaluationById with correct args and return result", async () => {
      const expected = { id: 5, name: "Eval" };
      mockEvaluationService.getEvaluationById.mockResolvedValue(expected);

      const result = await controller.findOne(3, 5, mockUser);

      expect(mockEvaluationService.getEvaluationById).toHaveBeenCalledWith(
        3,
        5,
        { user: mockUser },
      );
      expect(result).toEqual(expected);
    });

    it("should propagate service errors", async () => {
      mockEvaluationService.getEvaluationById.mockRejectedValue(new Error("Not found"));

      await expect(controller.findOne(1, 99, mockUser)).rejects.toThrow("Not found");
    });
  });


  describe("getPageEvaluationDetails", () => {
    it("should set gzip+json headers and pipe the file stream to res", async () => {
      const fakePath = "/tmp/result.json.gz";
      mockEvaluationService.getEvaluationResultJson.mockResolvedValue(fakePath);

      const fakeStream = makeFakeStream();
      (createReadStream as jest.Mock).mockReturnValue(fakeStream);

      const res = makeMockRes();

      await controller.getPageEvaluationDetails({} as any, 1, 10, res, mockUser);

      expect(mockEvaluationService.getEvaluationResultJson).toHaveBeenCalledWith(
        1,
        10,
        { user: mockUser },
      );
      expect(res.set).toHaveBeenCalledWith({
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
        "Content-Disposition": "inline",
      });
      expect(createReadStream).toHaveBeenCalledWith(fakePath);
      expect(fakeStream.pipe).toHaveBeenCalledWith(res);
    });

    it("should respond 500 when the file stream emits an error", async () => {
      mockEvaluationService.getEvaluationResultJson.mockResolvedValue("/tmp/bad.gz");

      const fakeStream = makeFakeStream(/* shouldError */ true);
      (createReadStream as jest.Mock).mockReturnValue(fakeStream);

      const res = makeMockRes();

      await controller.getPageEvaluationDetails({} as any, 1, 10, res, mockUser);

      // Allow the nextTick error emission to fire
      await new Promise((r) => process.nextTick(r));

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.send).toHaveBeenCalledWith({ message: "Erro ao ler storage" });
    });
  });

  // ── getPageEvaluationHtml ───────────────────────────────────────────────────

  describe("getPageEvaluationHtml", () => {
    it("should set gzip+html headers and pipe the file stream to res", async () => {
      const fakePath = "/tmp/result.html.gz";
      mockEvaluationService.getEvaluationHtml.mockResolvedValue(fakePath);

      const fakeStream = makeFakeStream();
      (createReadStream as jest.Mock).mockReturnValue(fakeStream);

      const res = makeMockRes();

      await controller.getPageEvaluationHtml({} as any, 1, 10, res, mockUser);

      expect(mockEvaluationService.getEvaluationHtml).toHaveBeenCalledWith(
        1,
        10,
        { user: mockUser },
      );
      expect(res.set).toHaveBeenCalledWith({
        "Content-Type": "text/html",
        "Content-Encoding": "gzip",
        "Content-Disposition": "inline",
      });
      expect(createReadStream).toHaveBeenCalledWith(fakePath);
      expect(fakeStream.pipe).toHaveBeenCalledWith(res);
    });

    it("should respond 500 when the file stream emits an error", async () => {
      mockEvaluationService.getEvaluationHtml.mockResolvedValue("/tmp/bad.html.gz");

      const fakeStream = makeFakeStream(true);
      (createReadStream as jest.Mock).mockReturnValue(fakeStream);

      const res = makeMockRes();

      await controller.getPageEvaluationHtml({} as any, 1, 10, res, mockUser);

      await new Promise((r) => process.nextTick(r));

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.send).toHaveBeenCalledWith({ message: "Erro ao ler storage" });
    });
  });

  // ── uploadExternalEvaluation ────────────────────────────────────────────────

  describe("uploadExternalEvaluation", () => {
    it("should call saveExternalEvaluation with correct args and return result", async () => {
      const body = { url: "https://example.com", score: 90 };
      const expected = { saved: true };
      mockEvaluationService.saveExternalEvaluation.mockResolvedValue(expected);

      const result = await controller.uploadExternalEvaluation(mockUser, 7, body);

      expect(mockEvaluationService.saveExternalEvaluation).toHaveBeenCalledWith(
        { user: mockUser },
        7,
        body,
      );
      expect(result).toEqual(expected);
    });

    it("should propagate service errors", async () => {
      mockEvaluationService.saveExternalEvaluation.mockRejectedValue(new Error("Validation failed"));

      await expect(
        controller.uploadExternalEvaluation(mockUser, 1, {}),
      ).rejects.toThrow("Validation failed");
    });
  });

  // ── evaluateManyPages ───────────────────────────────────────────────────────

  describe("evaluateManyPages", () => {
    it("should call evaluateWebsite with correct args and return void", async () => {
      mockEvaluationService.evaluateWebsite.mockResolvedValue(undefined);

      const result = await controller.evaluateManyPages(mockUser, 42);

      expect(mockEvaluationService.evaluateWebsite).toHaveBeenCalledWith(
        42,
        { user: mockUser },
      );
      expect(result).toBeUndefined();
    });

    it("should propagate service errors", async () => {
      mockEvaluationService.evaluateWebsite.mockRejectedValue(new Error("Queue full"));

      await expect(controller.evaluateManyPages(mockUser, 1)).rejects.toThrow("Queue full");
    });
  });
});