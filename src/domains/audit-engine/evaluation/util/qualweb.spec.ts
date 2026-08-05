import { evaluate } from "./qualweb";
import { QualWeb } from "@qualweb/core";
import { ACTRules } from "@qualweb/act-rules";
import { WCAGTechniques } from "@qualweb/wcag-techniques";
import { BestPractices } from "@qualweb/best-practices";
import { Counter } from "@qualweb/counter";

// Simple mocks that don't trigger side effects
jest.mock("@qualweb/core", () => ({
  QualWeb: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    evaluate: jest.fn().mockResolvedValue({}),
    stop: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@qualweb/act-rules", () => ({
  ACTRules: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@qualweb/wcag-techniques", () => ({
  WCAGTechniques: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@qualweb/best-practices", () => ({
  BestPractices: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@qualweb/counter", () => ({
  Counter: jest.fn().mockImplementation(() => ({})),
}));

describe("QualWeb Evaluation", () => {
  let mockQualWebInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mock instance that will be created
    mockQualWebInstance = {
      start: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue({}),
      stop: jest.fn().mockResolvedValue(undefined),
    };

    // Update the QualWeb mock to return our instance
    (QualWeb as jest.Mock).mockImplementation(() => mockQualWebInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("evaluate with single URL", () => {
    it("should evaluate a single URL successfully", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      const result = await evaluate({ url: "https://example.com" });

      expect(result).toEqual(mockReport);
      expect(mockQualWebInstance.start).toHaveBeenCalled();
      expect(mockQualWebInstance.evaluate).toHaveBeenCalled();
      expect(mockQualWebInstance.stop).toHaveBeenCalled();
    });

    it("should start QualWeb with correct configuration", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      expect(mockQualWebInstance.start).toHaveBeenCalledWith(
        expect.objectContaining({
          maxConcurrency: 2,
          timeout: expect.any(Number),
        }),
        expect.objectContaining({
          headless: true,
          args: expect.arrayContaining([
            "--no-sandbox",
            "--disable-gpu",
          ]),
        })
      );
    });

    it("should pass URL in evaluation options", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      expect(mockQualWebInstance.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://example.com",
          modules: expect.any(Array),
          waitUntil: expect.arrayContaining(["load", "networkidle2"]),
        })
      );
    });

    it("should throw error when report is empty for single URL", async () => {
      mockQualWebInstance.evaluate.mockResolvedValue({});

      await expect(
        evaluate({ url: "https://example.com" })
      ).rejects.toThrow("Invalid resource: QualWeb returned an empty report");
    });

    it("should throw error when report is null", async () => {
      mockQualWebInstance.evaluate.mockResolvedValue(null);

      await expect(
        evaluate({ url: "https://example.com" })
      ).rejects.toThrow("Invalid report: QualWeb returned null or invalid data");
    });

    it("should throw error when evaluation fails", async () => {
      mockQualWebInstance.evaluate.mockRejectedValue(
        new Error("Evaluation error")
      );

      await expect(
        evaluate({ url: "https://example.com" })
      ).rejects.toThrow("QualWeb evaluation failed");
    });

    it("should throw error when browser startup fails", async () => {
      mockQualWebInstance.start.mockRejectedValue(
        new Error("Browser startup failed")
      );

      await expect(
        evaluate({ url: "https://example.com" })
      ).rejects.toThrow("QualWeb evaluation failed");
    });

    it("should always stop QualWeb even if evaluation fails", async () => {
      mockQualWebInstance.evaluate.mockRejectedValue(
        new Error("Evaluation error")
      );

      try {
        await evaluate({ url: "https://example.com" });
      } catch {
        // Expected to fail
      }

      expect(mockQualWebInstance.stop).toHaveBeenCalled();
    });

    it("should always stop QualWeb even if startup fails", async () => {
      mockQualWebInstance.start.mockRejectedValue(
        new Error("Startup error")
      );

      try {
        await evaluate({ url: "https://example.com" });
      } catch {
        // Expected to fail
      }

      expect(mockQualWebInstance.stop).toHaveBeenCalled();
    });

    it("should not throw if QualWeb stop fails", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);
      mockQualWebInstance.stop.mockRejectedValue(
        new Error("Stop failed")
      );

      // Should not throw
      const result = await evaluate({ url: "https://example.com" });
      expect(result).toEqual(mockReport);
    });
  });

  describe("evaluate with multiple URLs", () => {
    it("should evaluate multiple URLs successfully", async () => {
      const mockReports = {
        "https://example1.com": { status: "pass" },
        "https://example2.com": { status: "pass" },
      };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReports);

      const result = await evaluate({
        urls: ["https://example1.com", "https://example2.com"],
      });

      expect(result).toEqual(mockReports);
    });

    it("should pass URLs array in evaluation options", async () => {
      const mockReports = {
        "https://example1.com": { status: "pass" },
      };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReports);

      await evaluate({ urls: ["https://example1.com", "https://example2.com"] });

      expect(mockQualWebInstance.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          urls: ["https://example1.com", "https://example2.com"],
        })
      );
    });

    it("should throw error when reports are empty for multiple URLs", async () => {
      mockQualWebInstance.evaluate.mockResolvedValue({});

      await expect(
        evaluate({ urls: ["https://example1.com", "https://example2.com"] })
      ).rejects.toThrow("Invalid resource: QualWeb returned empty reports");
    });

    it("should handle partial results (some URLs fail)", async () => {
      const mockReports = {
        "https://example1.com": { status: "pass" },
        // example2.com has no report
      };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReports);

      const result = await evaluate({
        urls: ["https://example1.com", "https://example2.com"],
      });

      expect(result).toEqual(mockReports);
      expect(result["https://example1.com"]).toBeDefined();
    });
  });

  describe("evaluate with HTML content", () => {
    it("should evaluate HTML content successfully", async () => {
      const mockReport = {
        customHtml: { status: "pass" },
      };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      const html = "<html><body>Test</body></html>";
      const result = await evaluate({ html });

      expect(result).toEqual(mockReport);
    });

    it("should pass HTML in evaluation options", async () => {
      const mockReport = {
        customHtml: { status: "pass" },
      };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      const html = "<html><body>Test</body></html>";
      await evaluate({ html });

      expect(mockQualWebInstance.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          html,
        })
      );
    });

    it("should handle complex HTML content", async () => {
      const complexHtml = `
        <!DOCTYPE html>
        <html lang="pt">
          <head>
            <meta charset="utf-8">
            <title>Test Page</title>
          </head>
          <body>
            <main>
              <h1>Heading</h1>
              <p>Paragraph</p>
              <img src="test.jpg" alt="test" />
            </main>
          </body>
        </html>
      `;

      const mockReport = {
        customHtml: { status: "pass", elements: 10 },
      };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      const result = await evaluate({ html: complexHtml });

      expect(result).toEqual(mockReport);
      expect(mockQualWebInstance.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          html: complexHtml,
        })
      );
    });
  });

  describe("input validation", () => {
    it("should throw error when params is null", async () => {
      await expect(evaluate(null as any)).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when params is undefined", async () => {
      await expect(evaluate(undefined as any)).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when params is not an object", async () => {
      await expect(evaluate("invalid" as any)).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when no input is provided", async () => {
      await expect(evaluate({})).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when URL is empty string", async () => {
      await expect(evaluate({ url: "" })).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when URLs array is empty", async () => {
      await expect(evaluate({ urls: [] })).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when HTML is empty string", async () => {
      await expect(evaluate({ html: "" })).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when URL is not a string", async () => {
      await expect(evaluate({ url: 123 as any })).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when HTML is not a string", async () => {
      await expect(evaluate({ html: {} as any })).rejects.toThrow(
        "Invalid evaluation parameters"
      );
    });

    it("should throw error when URLs contains non-string values", async () => {
      await expect(
        evaluate({ urls: ["https://example.com", 123 as any] })
      ).rejects.toThrow("Invalid evaluation parameters");
    });

    it("should throw error when URLs is not an array", async () => {
      await expect(
        evaluate({ urls: "not-an-array" as any })
      ).rejects.toThrow("Invalid evaluation parameters");
    });

    it("should reject unknown properties in params object", async () => {
      await expect(
        evaluate({ url: "https://example.com", unknownProp: "value" } as any)
      ).rejects.toThrow("Invalid evaluation parameters");
    });

    it("should throw error when both URL and unknown property provided", async () => {
      await expect(
        evaluate({ url: "https://example.com", extra: "field" } as any)
      ).rejects.toThrow("Invalid evaluation parameters");
    });
  });

  describe("QualWeb initialization", () => {
    it("should create QualWeb instance with correct configuration", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      expect(QualWeb).toHaveBeenCalledWith({
        adBlock: false,
        stealth: true,
      });
    });

    it("should create all required modules", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      expect(ACTRules).toHaveBeenCalledWith({ exclude: [] });
      expect(WCAGTechniques).toHaveBeenCalled();
      expect(BestPractices).toHaveBeenCalled();
      expect(Counter).toHaveBeenCalled();
    });

    it("should include user agent in browser args", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      const startCall = mockQualWebInstance.start.mock.calls[0];
      const browserArgs = startCall[1].args;

      expect(browserArgs).toContainEqual(
        expect.stringContaining("Mozilla/5.0")
      );
    });

    it("should include language settings in browser args", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      const startCall = mockQualWebInstance.start.mock.calls[0];
      const browserArgs = startCall[1].args;

      expect(browserArgs).toContainEqual("--lang=pt-pt,pt");
    });
  });

  describe("evaluation options", () => {
    it("should include waitUntil options", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      expect(mockQualWebInstance.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          waitUntil: ["load", "networkidle2"],
        })
      );
    });

    it("should enable file logging", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      expect(mockQualWebInstance.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          log: { file: true },
        })
      );
    });

    it("should include modules in options", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      await evaluate({ url: "https://example.com" });

      expect(mockQualWebInstance.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: expect.arrayContaining([expect.any(Object)]),
        })
      );
    });
  });

  describe("error handling and cleanup", () => {
    it("should include informative error message on failure", async () => {
      mockQualWebInstance.evaluate.mockRejectedValue(
        new Error("Specific evaluation error")
      );

      try {
        await evaluate({ url: "https://example.com" });
      } catch (error: any) {
        expect(error.message).toContain("QualWeb evaluation failed");
        expect(error.message).toContain("Specific evaluation error");
      }
    });

    it("should wrap non-Error exceptions in Error", async () => {
      mockQualWebInstance.evaluate.mockRejectedValue("String error");

      try {
        await evaluate({ url: "https://example.com" });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("String error");
      }
    });

    it("should attempt stop even if evaluation throws", async () => {
      mockQualWebInstance.evaluate.mockRejectedValue(
        new Error("Evaluation error")
      );

      try {
        await evaluate({ url: "https://example.com" });
      } catch {
        // Expected
      }

      expect(mockQualWebInstance.stop).toHaveBeenCalled();
    });

    it("should attempt stop even if start throws", async () => {
      mockQualWebInstance.start.mockRejectedValue(
        new Error("Start error")
      );

      try {
        await evaluate({ url: "https://example.com" });
      } catch {
        // Expected
      }

      expect(mockQualWebInstance.stop).toHaveBeenCalled();
    });

    it("should log stop error but not throw", async () => {
      const mockReport = { "https://example.com": { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);
      mockQualWebInstance.stop.mockRejectedValue(new Error("Stop error"));

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await evaluate({ url: "https://example.com" });

      expect(result).toEqual(mockReport);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[QualWeb Stop Failed]")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("edge cases", () => {
    it("should handle reports with additional metadata", async () => {
      const mockReports = {
        "https://example.com": {
          status: "pass",
          tests: 100,
          score: 95,
          rules: { rule1: "pass", rule2: "fail" },
        },
      };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReports);

      const result = await evaluate({ url: "https://example.com" });

      expect(result["https://example.com"].score).toBe(95);
      expect(result["https://example.com"].rules).toBeDefined();
    });

    it("should handle very long URLs", async () => {
      const longUrl = "https://example.com/" + "path/".repeat(100) + "page";
      const mockReport = { [longUrl]: { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      const result = await evaluate({ url: longUrl });

      expect(result[longUrl]).toBeDefined();
    });

    it("should handle URLs with special characters", async () => {
      const urlWithParams =
        "https://example.com/page?param1=value1&param2=value2&special=!@#$%";
      const mockReport = { [urlWithParams]: { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      const result = await evaluate({ url: urlWithParams });

      expect(result[urlWithParams]).toBeDefined();
    });

    it("should handle unicode in HTML content", async () => {
      const htmlWithUnicode = `
        <html>
          <body>
            <p>Conteúdo em português: áéíóú</p>
            <p>Caracteres especiais: €£¥</p>
          </body>
        </html>
      `;
      const mockReport = { customHtml: { status: "pass" } };
      mockQualWebInstance.evaluate.mockResolvedValue(mockReport);

      const result = await evaluate({ html: htmlWithUnicode });

      expect(result.customHtml).toBeDefined();
    });

    it("should handle large number of URLs", async () => {
      const urls = Array.from(
        { length: 100 },
        (_, i) => `https://example${i}.com`
      );
      const mockReports = Object.fromEntries(
        urls.map((url) => [url, { status: "pass" }])
      );
      mockQualWebInstance.evaluate.mockResolvedValue(mockReports);

      const result = await evaluate({ urls });

      expect(Object.keys(result)).toHaveLength(100);
    });
  });

  describe("concurrent execution", () => {
    it("should maintain separate QualWeb instances for parallel calls", async () => {
      const mockReport1 = { "https://example1.com": { status: "pass" } };
      const mockReport2 = { "https://example2.com": { status: "pass" } };

      mockQualWebInstance.evaluate
        .mockResolvedValueOnce(mockReport1)
        .mockResolvedValueOnce(mockReport2);

      const [result1, result2] = await Promise.all([
        evaluate({ url: "https://example1.com" }),
        evaluate({ url: "https://example2.com" }),
      ]);

      expect(result1).toEqual(mockReport1);
      expect(result2).toEqual(mockReport2);
      expect(QualWeb).toHaveBeenCalledTimes(2);
    });
  });
});
