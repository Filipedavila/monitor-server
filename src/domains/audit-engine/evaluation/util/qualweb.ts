import { QualWeb, QualwebOptions } from "@qualweb/core";
import { PlaywrightDriver } from '@qualweb/playwright-driver';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ACTRules } from "@qualweb/act-rules";
import { WCAGTechniques } from '@qualweb/wcag-techniques';
import { BestPractices } from "@qualweb/best-practices";
import { Counter } from "@qualweb/counter";
import { z } from "zod";

chromium.use(StealthPlugin());
// Constants
const MAX_CONCURRENCY = 2;
const TIMEOUT_SECONDS = 240; // 4 minutes
const TIMEOUT_MS = TIMEOUT_SECONDS * 1000;
const QUALWEB_START_TIMEOUT = TIMEOUT_MS * 2; // 8 minutes for browser startup

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";
const LANGUAGE = "pt-pt,pt";

const BROWSER_ARGS = [
  "--no-sandbox",
  "--ignore-certificate-errors",
  "--disable-features=IsolateSandboxedIframes",
  "--disable-site-isolation-trials",
  "--disable-setuid-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--disable-blink-features=AutomationControlled",
  "--disable-extensions",
  "--no-zygote",
  `--user-agent="${USER_AGENT}"`,
  `--lang=${LANGUAGE}`,
];

// Zod schema for evaluation parameters validation
const EvaluationParamsSchema = z.object({
  url: z.string().min(1).optional(),
  urls: z.array(z.string().min(1)).min(1).optional(),
  html: z.string().min(1).optional(),
}).strict().refine(
  (data) => data.url || data.urls || data.html,
  {
    message: "At least one of 'url', 'urls', or 'html' must be provided",
    path: [],
  }
);

interface EvaluationParams extends z.infer<typeof EvaluationParamsSchema> {}

interface EvaluationReports {
  [key: string]: any;
}

/**
 * Creates and configures QualWeb evaluation modules
 * @returns Array of configured QualWeb modules
 */
function createModules(): any[] {
  return [
    new ACTRules({ exclude: [] }),
    new WCAGTechniques(),
    new BestPractices(),
    new Counter(),
  ];
}

/**
 * Creates QualWeb evaluation options from provided parameters
 * @param params - Evaluation parameters
 * @returns Configured QualwebOptions object
 */
function createEvaluationOptions(params: EvaluationParams): QualwebOptions {
  const options: QualwebOptions = {
    modules: createModules(),
    waitUntil: ["load", "networkidle2"],
    log: { file: true },
  };

  if (params.url) {
    options.url = params.url;
  } else if (params.urls) {
    options.urls = params.urls;
  } else if (params.html) {
    options.html = params.html;
  }

  return options;
}

/**
 * Validates evaluation reports
 * @param reports - Evaluation reports from QualWeb
 * @param params - Original evaluation parameters
 * @throws Error if reports are invalid or empty when single URL provided
 */
function validateReports(
  reports: EvaluationReports | null | undefined,
  params: EvaluationParams
): void {
  if (!reports || typeof reports !== "object") {
    throw new Error("Invalid report: QualWeb returned null or invalid data.");
  }

  const reportCount = Object.keys(reports).length;
  if (reportCount === 0 && params.url) {
    throw new Error(
      `Invalid resource: QualWeb returned an empty report for URL: ${params.url}`
    );
  }

  if (reportCount === 0 && (params.urls?.length ?? 0) > 0) {
    throw new Error("Invalid resource: QualWeb returned empty reports for provided URLs.");
  }
}

/**
 * Starts QualWeb browser cluster with configured options
 * @param qualweb - QualWeb instance
 * @throws Error if browser startup fails
 */
async function startQualWeb(qualweb: QualWeb): Promise<void> {
  try {
    await qualweb.start(
      {
        maxConcurrency: MAX_CONCURRENCY,
        timeout: QUALWEB_START_TIMEOUT,
      },
      {
        headless: true,
        args: BROWSER_ARGS,
      }
    );
  } catch (error) {
    throw new Error(
      `Failed to start QualWeb browser cluster: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Safely stops QualWeb browser cluster
 * @param qualweb - QualWeb instance
 * @returns Promise that resolves even if stop fails (errors are logged)
 */
async function stopQualWeb(qualweb: QualWeb): Promise<void> {
  try {
    await qualweb.stop();
  } catch (error) {
    // Log but don't throw - cleanup errors shouldn't fail the whole operation
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[QualWeb Stop Failed]: ${errorMsg}`);
  }
}

/**
 * Executes QualWeb accessibility evaluation on provided URLs or HTML content
 * 
 * @param params - Evaluation parameters containing either:
 *   - url: Single URL to evaluate
 *   - urls: Array of URLs to evaluate
 *   - html: HTML content string to evaluate
 * @returns Promise resolving to evaluation reports object
 * @throws Error if parameters are invalid, evaluation fails, or QualWeb startup fails
 * 
 * @example
 * // Evaluate single URL
 * const reports = await evaluate({ url: "https://example.com" });
 * 
 * @example
 * // Evaluate multiple URLs
 * const reports = await evaluate({ urls: ["https://example1.com", "https://example2.com"] });
 * 
 * @example
 * // Evaluate HTML content
 * const reports = await evaluate({ html: "<html><body>Test</body></html>" });
 */
export async function evaluate(params: EvaluationParams): Promise<EvaluationReports> {
  // Validate parameters using Zod schema
  let validatedParams: EvaluationParams;
  try {
    validatedParams = EvaluationParamsSchema.parse(params);
  } catch (validationError: any) {
    // Handle Zod validation errors
    if (validationError?.errors && Array.isArray(validationError.errors)) {
      const messages = validationError.errors
        .map((e: any) => e.message)
        .join(", ");
      throw new Error(`Invalid evaluation parameters: ${messages}`);
    }
    // Fallback for other errors
    throw new Error(
      `Invalid evaluation parameters: ${validationError?.message || "validation failed"}`
    );
  } 
  const driver = new PlaywrightDriver({
    browser: 'chromium', // or 'firefox' / 'webkit'
    launchOptions: { headless: true },
  });
  const qualweb = new QualWeb(undefined, driver);

  try {
    // Start QualWeb cluster
    await startQualWeb(qualweb);

    // Create evaluation options
    const options = createEvaluationOptions(validatedParams);

    // Execute evaluation
    const reports = await qualweb.evaluate(options);

    // Validate reports
    validateReports(reports, validatedParams);

    return reports as EvaluationReports;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`QualWeb evaluation failed: ${errorMsg}`);
  } finally {
    // Always cleanup browser resources
    await stopQualWeb(qualweb);
  }
}