
import * as qualweb from "./qualweb";
import  {testColors,ruleset, getElementsMapping, generateScore}  from "@a12e/accessmonitor-rulesets";
import { generateMd5Hash } from "src/common/security"; 

const PROTOCOL_HTTP = "http://";
const PROTOCOL_HTTPS = "https://";
const ENCODING_UTF8 = "utf-8";
const CONTENT_TYPE_HTML = "text/html";
const CUSTOM_HTML_KEY = "customHtml";
const SEPARATOR = "@";

interface ConformanceErrors {
  A: number;
  AA: number;
  AAA: number;
}

interface EvaluationReport {
  pagecode: string;
  data: {
    title: string;
    rawUrl: string;
    elems: Record<string, unknown>;
    nodes: Record<string, unknown>;
    date: string;
    metrics: Record<string, unknown>;
    score: number;
    conform: string;
    tot: {
      info: {
        url: string;
        title: string;
        date: string;
        htmlTags: number;
        roles: Record<string, unknown>;
        cTags: Record<string, number>;
        size: number;
        encoding: string;
        content: string;
        hash: string;
        tests: number;
        score: number;
        conform: string;
      };
      elems: Record<string, unknown>;
      results: Record<string, unknown>;
    };
  };
}

/**
 * Calculates total number of HTML elements from tags frequency map
 * @param tags - Record mapping tag names to their counts
 * @returns Total count of all elements
 * @throws Error if tags is not an object
 */
function calculateTotalElements(tags: Record<string, number>): number {
  if (!tags || typeof tags !== "object") {
    return 0;
  }
  
  return Object.values(tags).reduce((sum, count) => sum + (count ?? 0), 0);
}

/**
 * Calculates WCAG conformance levels (A, AA, AAA) based on test results
 * @param results - Test results mapping rule IDs to results
 * @returns Formatted string with counts: "A@AA@AAA"
 * @throws Error if results are invalid
 */
function calculateConform(results: Record<string, unknown>): string {
  const errors: ConformanceErrors = {
    A: 0,
    AA: 0,
    AAA: 0,
  };
  
  if (!results || typeof results !== "object") {
    return `${errors.A}${SEPARATOR}${errors.AA}${SEPARATOR}${errors.AAA}`;
  }

  for (const ruleId in results) {
    if (ruleId && ruleset[ruleId]) {
      try {
        const level = ruleset[ruleId].level.toUpperCase() as keyof ConformanceErrors;
        if (testColors[ruleId] === "R" && level in errors) {
          errors[level]++;
        }
      } catch (e) {
        // Skip invalid rule entries
        continue;
      }
    }
  }

  return `${errors.A}${SEPARATOR}${errors.AA}${SEPARATOR}${errors.AAA}`;
}

/**
 * Formats ISO date string to readable format (YYYY-MM-DD HH:mm:ss)
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string
 */
function formatDate(isoDate: string): string {
  return isoDate
    .replace(/T/, " ")
    .replace(/\..+/, "");
}

/**
 * Calculates HTML page size from encoded content
 * @param html - Raw HTML content
 * @returns Size in encoded URI characters
 */
function calculatePageSize(html: string): number {
  if (!html || typeof html !== "string") {
    return 0;
  }
  return encodeURI(html).split(/%..|./).length - 1;
}

/**
 * Validates URL format and adds protocol if missing
 * @param url - URL to normalize
 * @returns Normalized URL with protocol
 * @throws Error if URL is empty or invalid
 */
function normalizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    throw new Error("URL must be a non-empty string");
  }

  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    throw new Error("URL cannot be empty after trimming");
  }

  if (trimmedUrl.startsWith(PROTOCOL_HTTP) || trimmedUrl.startsWith(PROTOCOL_HTTPS)) {
    return trimmedUrl;
  }

  return PROTOCOL_HTTP + trimmedUrl;
}

/**
 * Parses QualWeb evaluation report and returns structured report object
 * @param evaluation - Raw evaluation report from QualWeb
 * @returns Formatted evaluation report
 * @throws Error if evaluation is invalid or missing required fields
 */
function parseEvaluation(evaluation: any): EvaluationReport {
  if (!evaluation || typeof evaluation !== "object") {
    throw new Error("Invalid evaluation: evaluation object is required");
  }

  try {
    const { elements, results, nodes, metrics } = getElementsMapping(evaluation);
    
    const pagecode = evaluation?.system?.page?.dom?.html;
    const title = evaluation?.system?.page?.dom?.title;
    const completeUrl = evaluation?.system?.url?.completeUrl || "";
    const tags = evaluation?.modules?.counter?.data?.tags || {};
    const roles = evaluation?.modules?.counter?.data?.roles || {};
    
    if (!pagecode) {
      throw new Error("Missing page HTML content");
    }

    const currentDate = formatDate(new Date().toISOString());
    const htmlTags = calculateTotalElements(tags);
    const pageSize = calculatePageSize(pagecode);
    const safeResults = results || {};
    const conform = calculateConform(safeResults);
    const hash = generateMd5Hash(currentDate);
    const testsCount = Object.keys(safeResults).length;

    const report: EvaluationReport = {
      pagecode,
      data: {
        title: title || "",
        rawUrl: completeUrl,
        elems: elements,
        nodes,
        date: currentDate,
        metrics,
        conform,
        score: 0, // Will be populated by generateScore
        tot: {
          info: {
            url: completeUrl,
            title: title || "",
            date: currentDate,
            htmlTags,
            roles,
            cTags: tags,
            size: pageSize,
            encoding: ENCODING_UTF8,
            content: CONTENT_TYPE_HTML,
            hash,
            tests: testsCount,
            conform,
            score: 0, // Will be populated by generateScore
          },
          elems: elements,
          results: safeResults,
        },
      },
    };

    // Generate and assign score
    const score = Number(generateScore(report as any));
    report.data.score = score;
    report.data.tot.info.score = score;

    return report;
  } catch (error) {
    throw new Error(
      `Failed to parse evaluation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Executes QualWeb evaluation for a single URL
 * @param url - URL to evaluate
 * @returns Formatted evaluation report
 * @throws Error if URL is invalid or evaluation fails
 */
export async function executeUrlEvaluation(url: string): Promise<EvaluationReport> {
  if (!url || typeof url !== "string") {
    throw new Error("URL must be provided and must be a string");
  }

  try {
    const normalizedUrl = normalizeUrl(url);
    const reports = await qualweb.evaluate({ url: normalizedUrl });
    
    if (!reports || !reports[normalizedUrl]) {
      throw new Error(`No evaluation report found for URL: ${normalizedUrl}`);
    }

    return parseEvaluation(reports[normalizedUrl]);
  } catch (error) {
    throw new Error(
      `URL evaluation failed for "${url}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Executes QualWeb evaluation for multiple URLs in batch
 * @param urls - Array of URLs to evaluate
 * @returns Record mapping each URL to its evaluation report
 * @throws Error if no valid URLs provided or evaluation fails
 */
export async function executeUrlsEvaluation(urls: string[]): Promise<Record<string, EvaluationReport>> {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("URLs array must be provided and contain at least one URL");
  }

  try {
    const normalizedUrls: string[] = [];
    
    for (const url of urls) {
      try {
        normalizedUrls.push(normalizeUrl(url));
      } catch (error) {
        throw new Error(`Invalid URL in batch: ${url}`);
      }
    }

    const reports = await qualweb.evaluate({ urls: normalizedUrls });
    
    if (!reports || typeof reports !== "object") {
      throw new Error("No evaluation reports received from QualWeb");
    }

    const results: Record<string, EvaluationReport> = {};
    
    for (const url of normalizedUrls) {
      if (reports[url]) {
        try {
          results[url] = parseEvaluation(reports[url]);
        } catch (error) {
          throw new Error(`Failed to parse report for URL ${url}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return results;
  } catch (error) {
    throw new Error(
      `Batch URL evaluation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Executes QualWeb evaluation for raw HTML content
 * @param html - HTML content to evaluate
 * @returns Formatted evaluation report
 * @throws Error if HTML is invalid or evaluation fails
 */
export async function executeHtmlEvaluation(html: string): Promise<EvaluationReport> {
  if (!html || typeof html !== "string") {
    throw new Error("HTML content must be provided and must be a string");
  }

  try {
    const reports = await qualweb.evaluate({ html });
    
    if (!reports || !reports[CUSTOM_HTML_KEY]) {
      throw new Error("No evaluation report found for HTML");
    }

    return parseEvaluation(reports[CUSTOM_HTML_KEY]);
  } catch (error) {
    throw new Error(
      `HTML evaluation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
