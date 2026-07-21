// Mock dependencies before importing the module under test
jest.mock("./qualweb", () => ({
  evaluate: jest.fn(),
}));

jest.mock("@a12e/accessmonitor-rulesets");
jest.mock("src/common/security");

import * as qualweb from "./qualweb";
import {
  executeUrlEvaluation,
  executeUrlsEvaluation,
  executeHtmlEvaluation,
} from "./middleware";
import * as rulesets from "@a12e/accessmonitor-rulesets";
import { generateMd5Hash } from "src/common/security";

describe("Evaluation Middleware", () => {
  // Mock data factory
  const createMockEvaluation = (overrides?: any) => ({
    system: {
      page: {
        dom: {
          html: "<html><body>Test</body></html>",
          title: "Test Page",
        },
      },
      url: {
        completeUrl: "https://example.com",
      },
    },
    modules: {
      counter: {
        data: {
          tags: { div: 5, p: 3, a: 2 },
          roles: { button: 1, link: 2 },
        },
      },
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T10:30:00.000Z"));

    // Default mock implementations
    (rulesets.getElementsMapping as jest.Mock).mockReturnValue({
      elements: { div: { count: 5 } },
      results: { "rule-1": true },
      nodes: { rule: [{ node: "test" }] },
      metrics: { passed: 100 },
    });

    (rulesets.generateScore as jest.Mock).mockReturnValue(95);
    (rulesets.testColors as any) = { "rule-1": "R" };
    (rulesets.ruleset as any) = {
      "rule-1": { level: "a" },
      "rule-2": { level: "aa" },
      "rule-3": { level: "aaa" },
    };
    (generateMd5Hash as jest.Mock).mockReturnValue("hash123");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("executeUrlEvaluation", () => {
    it("should evaluate a valid HTTP URL", async () => {
      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result).toBeDefined();
      expect(result.data.rawUrl).toBe("https://example.com");
      expect(result.pagecode).toBe("<html><body>Test</body></html>");
      expect(result.data.title).toBe("Test Page");
    });

    it("should normalize URL by adding http:// protocol", async () => {
      const mockEvaluation = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "http://example.com" },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "http://example.com": mockEvaluation,
      });

      await executeUrlEvaluation("example.com");

      expect(qualweb.evaluate).toHaveBeenCalledWith({
        url: "http://example.com",
      });
    });

    it("should preserve https:// protocol", async () => {
      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      await executeUrlEvaluation("https://example.com");

      expect(qualweb.evaluate).toHaveBeenCalledWith({
        url: "https://example.com",
      });
    });

    it("should throw error for empty URL", async () => {
      await expect(executeUrlEvaluation("")).rejects.toThrow(
        "URL must be provided and must be a string"
      );
    });

    it("should throw error for URL with only whitespace", async () => {
      await expect(executeUrlEvaluation("   ")).rejects.toThrow(
        "URL cannot be empty after trimming"
      );
    });

    it("should throw error for non-string URL", async () => {
      await expect(executeUrlEvaluation(null as any)).rejects.toThrow(
        "URL must be provided and must be a string"
      );
    });

    it("should throw error when evaluation report is missing", async () => {
      (qualweb.evaluate as jest.Mock).mockResolvedValue({});

      await expect(executeUrlEvaluation("https://example.com")).rejects.toThrow(
        "No evaluation report found for URL"
      );
    });

    it("should throw error when qualweb evaluate fails", async () => {
      (qualweb.evaluate as jest.Mock).mockRejectedValue(
        new Error("QualWeb failed")
      );

      await expect(executeUrlEvaluation("https://example.com")).rejects.toThrow(
        "URL evaluation failed"
      );
    });

    it("should trim whitespace from URL", async () => {
      const mockEvaluation = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "http://example.com" },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "http://example.com": mockEvaluation,
      });

      await executeUrlEvaluation("  example.com  ");

      expect(qualweb.evaluate).toHaveBeenCalledWith({
        url: "http://example.com",
      });
    });

    it("should calculate correct page size", async () => {
      const mockEvaluation = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          page: {
            dom: {
              html: "test",
              title: "Test",
            },
          },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.tot.info.size).toBeGreaterThan(0);
    });

    it("should generate hash for page", async () => {
      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.tot.info.hash).toBe("hash123");
      expect(generateMd5Hash).toHaveBeenCalled();
    });

    it("should include correct metadata in result", async () => {
      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.tot.info.encoding).toBe("utf-8");
      expect(result.data.tot.info.content).toBe("text/html");
      expect(result.data.tot.info.htmlTags).toBe(10); // 5 + 3 + 2
      expect(result.data.tot.info.tests).toBe(1);
    });

    it("should include score in result", async () => {
      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.score).toBe(95);
      expect(result.data.tot.info.score).toBe(95);
    });

    it("should format date correctly", async () => {
      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.date).toBe("2024-01-15 10:30:00");
      expect(result.data.tot.info.date).toBe("2024-01-15 10:30:00");
    });
  });

  describe("executeUrlsEvaluation", () => {
    it("should evaluate multiple URLs", async () => {
      const mockEval1 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "https://example1.com" },
        },
      });
      const mockEval2 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "https://example2.com" },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example1.com": mockEval1,
        "https://example2.com": mockEval2,
      });

      const result = await executeUrlsEvaluation([
        "https://example1.com",
        "https://example2.com",
      ]);

      expect(result["https://example1.com"]).toBeDefined();
      expect(result["https://example2.com"]).toBeDefined();
    });

    it("should normalize URLs in batch", async () => {
      const mockEval1 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "http://example1.com" },
        },
      });
      const mockEval2 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "http://example2.com" },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "http://example1.com": mockEval1,
        "http://example2.com": mockEval2,
      });

      await executeUrlsEvaluation(["example1.com", "example2.com"]);

      expect(qualweb.evaluate).toHaveBeenCalledWith({
        urls: ["http://example1.com", "http://example2.com"],
      });
    });

    it("should throw error for empty array", async () => {
      await expect(executeUrlsEvaluation([])).rejects.toThrow(
        "URLs array must be provided and contain at least one URL"
      );
    });

    it("should throw error for null array", async () => {
      await expect(executeUrlsEvaluation(null as any)).rejects.toThrow(
        "URLs array must be provided and contain at least one URL"
      );
    });

    it("should throw error for non-array input", async () => {
      await expect(executeUrlsEvaluation("not-an-array" as any)).rejects.toThrow(
        "URLs array must be provided and contain at least one URL"
      );
    });

    it("should throw error if any URL is invalid", async () => {
      await expect(
        executeUrlsEvaluation([
          "https://example.com",
          null as any,
        ])
      ).rejects.toThrow("Invalid URL in batch");
    });

    it("should throw error when no evaluation reports received", async () => {
      (qualweb.evaluate as jest.Mock).mockResolvedValue(null);

      await expect(
        executeUrlsEvaluation(["https://example.com"])
      ).rejects.toThrow("No evaluation reports received from QualWeb");
    });

    it("should skip URLs without reports", async () => {
      const mockEval1 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "https://example1.com" },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example1.com": mockEval1,
        "https://example2.com": null,
      });

      const result = await executeUrlsEvaluation([
        "https://example1.com",
        "https://example2.com",
      ]);

      expect(result["https://example1.com"]).toBeDefined();
      expect(result["https://example2.com"]).toBeUndefined();
    });

    it("should handle mixed URL formats", async () => {
      const mockEval1 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "https://example1.com" },
        },
      });
      const mockEval2 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "http://example2.com" },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example1.com": mockEval1,
        "http://example2.com": mockEval2,
      });

      await executeUrlsEvaluation([
        "https://example1.com",
        "example2.com",
      ]);

      expect(qualweb.evaluate).toHaveBeenCalledWith({
        urls: ["https://example1.com", "http://example2.com"],
      });
    });
  });

  describe("executeHtmlEvaluation", () => {
    it("should evaluate HTML content", async () => {
      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        customHtml: mockEvaluation,
      });

      const result = await executeHtmlEvaluation(
        "<html><body>Test</body></html>"
      );

      expect(result).toBeDefined();
      expect(result.pagecode).toBe("<html><body>Test</body></html>");
    });

    it("should throw error for empty HTML", async () => {
      await expect(executeHtmlEvaluation("")).rejects.toThrow(
        "HTML content must be provided and must be a string"
      );
    });

    it("should throw error for null HTML", async () => {
      await expect(executeHtmlEvaluation(null as any)).rejects.toThrow(
        "HTML content must be provided and must be a string"
      );
    });

    it("should throw error for non-string HTML", async () => {
      await expect(executeHtmlEvaluation({} as any)).rejects.toThrow(
        "HTML content must be provided and must be a string"
      );
    });

    it("should throw error when evaluation report is missing", async () => {
      (qualweb.evaluate as jest.Mock).mockResolvedValue({});

      await expect(
        executeHtmlEvaluation("<html><body>Test</body></html>")
      ).rejects.toThrow("No evaluation report found for HTML");
    });

    it("should throw error when qualweb evaluate fails", async () => {
      (qualweb.evaluate as jest.Mock).mockRejectedValue(
        new Error("QualWeb failed")
      );

      await expect(
        executeHtmlEvaluation("<html><body>Test</body></html>")
      ).rejects.toThrow("HTML evaluation failed");
    });

    it("should handle complex HTML content", async () => {
      const complexHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Complex</title></head>
          <body>
            <div class="container">
              <p>Test content</p>
              <img src="test.jpg" alt="test" />
            </div>
          </body>
        </html>
      `;

      const mockEvaluation = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          page: {
            dom: {
              html: complexHtml,
              title: "Complex",
            },
          },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        customHtml: mockEvaluation,
      });

      const result = await executeHtmlEvaluation(complexHtml);

      expect(result.pagecode).toBe(complexHtml);
      expect(result.data.title).toBe("Complex");
    });
  });

  describe("Conformance calculations", () => {
    it("should calculate A level errors correctly", async () => {
      (rulesets.getElementsMapping as jest.Mock).mockReturnValue({
        elements: { div: { count: 5 } },
        results: { "rule-a1": true, "rule-a2": true, "rule-aa": true },
        nodes: { rule: [{ node: "test" }] },
        metrics: { passed: 100 },
      });

      (rulesets.testColors as any) = {
        "rule-a1": "R",
        "rule-a2": "R",
        "rule-aa": "R",
      };
      (rulesets.ruleset as any) = {
        "rule-a1": { level: "a" },
        "rule-a2": { level: "a" },
        "rule-aa": { level: "aa" },
      };

      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      const conform = result.data.conform;
      const parts = conform.split("@");
      expect(parseInt(parts[0])).toBe(2); // 2 A level errors
      expect(parseInt(parts[1])).toBe(1); // 1 AA level error
    });

    it("should handle missing ruleset entries gracefully", async () => {
      (rulesets.testColors as any) = {
        "rule-1": "R",
        "unknown-rule": "R",
      };
      (rulesets.ruleset as any) = {
        "rule-1": { level: "a" },
        // "unknown-rule" is missing
      };

      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.conform).toBeDefined();
    });
  });

  describe("Error handling edge cases", () => {
    it("should handle evaluation with missing system data", async () => {
      const mockEvaluation = {
        modules: {
          counter: {
            data: {
              tags: {},
              roles: {},
            },
          },
        },
      };

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      await expect(
        executeUrlEvaluation("https://example.com")
      ).rejects.toThrow("Failed to parse evaluation");
    });

    it("should handle evaluation with missing page HTML", async () => {
      const mockEvaluation = createMockEvaluation({
        system: {
          page: {
            dom: {
              title: "Test",
              // html is missing
            },
          },
          url: { completeUrl: "https://example.com" },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      await expect(
        executeUrlEvaluation("https://example.com")
      ).rejects.toThrow("Failed to parse evaluation");
    });

    it("should handle evaluation with null results", async () => {
      (rulesets.getElementsMapping as jest.Mock).mockReturnValue({
        elements: {},
        results: {},
        nodes: {},
        metrics: {},
      });

      const mockEvaluation = createMockEvaluation();
      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.tot.info.tests).toBe(0);
      expect(result.data.conform).toBeDefined();
    });

    it("should handle empty tags gracefully", async () => {
      const mockEvaluation = createMockEvaluation({
        modules: {
          counter: {
            data: {
              tags: {},
              roles: {},
            },
          },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.tot.info.htmlTags).toBe(0);
    });
  });

  describe("Data integrity", () => {
    it("should preserve all evaluation data in result", async () => {
      const mockEvaluation = createMockEvaluation();
      const customElements = { custom: { count: 42 } };
      const customMetrics = { custom: "value" };

      (rulesets.getElementsMapping as jest.Mock).mockReturnValue({
        elements: customElements,
        results: { "rule-1": true },
        nodes: { rule: [{ node: "test" }] },
        metrics: customMetrics,
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example.com": mockEvaluation,
      });

      const result = await executeUrlEvaluation("https://example.com");

      expect(result.data.elems).toEqual(customElements);
      expect(result.data.metrics).toEqual(customMetrics);
    });

    it("should create separate report instances for batch evaluation", async () => {
      const mockEval1 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "https://example1.com" },
          page: {
            dom: {
              html: "<html>1</html>",
              title: "Page 1",
            },
          },
        },
      });
      const mockEval2 = createMockEvaluation({
        system: {
          ...createMockEvaluation().system,
          url: { completeUrl: "https://example2.com" },
          page: {
            dom: {
              html: "<html>2</html>",
              title: "Page 2",
            },
          },
        },
      });

      (qualweb.evaluate as jest.Mock).mockResolvedValue({
        "https://example1.com": mockEval1,
        "https://example2.com": mockEval2,
      });

      const result = await executeUrlsEvaluation([
        "https://example1.com",
        "https://example2.com",
      ]);

      expect(result["https://example1.com"].data.title).toBe("Page 1");
      expect(result["https://example2.com"].data.title).toBe("Page 2");
      expect(result["https://example1.com"].pagecode).toBe("<html>1</html>");
      expect(result["https://example2.com"].pagecode).toBe("<html>2</html>");
    });
  });
});
