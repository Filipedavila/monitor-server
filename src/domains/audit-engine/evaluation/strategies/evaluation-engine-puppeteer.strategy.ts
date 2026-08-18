import { Injectable, Logger } from '@nestjs/common';
import { QualWeb, QualwebOptions } from '@qualweb/core';
import { ACTRules } from '@qualweb/act-rules';
import { WCAGTechniques } from '@qualweb/wcag-techniques';
import { BestPractices } from '@qualweb/best-practices';
import { Counter } from '@qualweb/counter';
import { z } from 'zod';
import { EvaluationEngine } from '../types/evaluation-engine.interface';



const TIMEOUT_SECONDS = 240;
const TIMEOUT_MS = TIMEOUT_SECONDS * 1000;
const QUALWEB_START_TIMEOUT = TIMEOUT_MS * 2;
const MAX_CONCURRENCY = 2;

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';
const LANGUAGE = 'pt-pt,pt';

const BROWSER_ARGS = [
  '--no-sandbox',
  '--ignore-certificate-errors',
  '--disable-features=IsolateSandboxedIframes',
  '--disable-site-isolation-trials',
  '--disable-setuid-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--disable-blink-features=AutomationControlled',
  '--disable-extensions',
  '--no-zygote',
  `--user-agent="${USER_AGENT}"`,
  `--lang=${LANGUAGE}`,
];

const UrlSchema = z.string().url();

@Injectable()
export class QualWebPuppeteerEngine implements EvaluationEngine {
  private readonly logger = new Logger(QualWebPuppeteerEngine.name);

  private createModules(): any[] {
    return [
      new ACTRules({ exclude: [] }),
      new WCAGTechniques(),
      new BestPractices(),
      new Counter(),
    ];
  }

  private createEvaluationOptions(url: string): QualwebOptions {
    return {
      modules: this.createModules(),
      waitUntil: ['load', 'networkidle2'],
      log: { file: true },
      url,
    };
  }

  private validateReports(reports: any | null | undefined, url: string): void {
    if (!reports || typeof reports !== 'object') {
      throw new Error('Invalid report: QualWeb returned null or invalid data.');
    }

    if (Object.keys(reports).length === 0) {
      throw new Error(`Invalid resource: QualWeb returned an empty report for URL: ${url}`);
    }
  }

  private async startQualWeb(qualweb: QualWeb): Promise<void> {
    try {
      await qualweb.start(
        {
          maxConcurrency: MAX_CONCURRENCY,
          timeout: QUALWEB_START_TIMEOUT,
        },
        {
          headless: true,
          args: BROWSER_ARGS,
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to start QualWeb browser cluster: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async stopQualWeb(qualweb: QualWeb): Promise<void> {
    try {
      await qualweb.stop();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[QualWeb Stop Failed]: ${errorMsg}`);
    }
  }

  public async evaluate(url: string): Promise<any> {
    const parseResult = UrlSchema.safeParse(url);
    if (!parseResult.success) {
      throw new Error(`Invalid evaluation parameter: URL must be a valid format. Details: ${parseResult.error.message}`);
    }

  
    const qualweb = new QualWeb({
    adBlock: true,
    stealth: true 
  });

    try {
      await this.startQualWeb(qualweb);

      const options = this.createEvaluationOptions(url);
      const reports = await qualweb.evaluate(options);

      this.validateReports(reports, url);
      const evaluationReport = reports[url] || reports[Object.keys(reports)[0]];

      if (!evaluationReport) {
        throw new Error(`QualWeb evaluation output missing report payload for URL: ${url}`);
      }
      return evaluationReport;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`QualWeb evaluation failed for URL ${url}: ${errorMsg}`);
      throw new Error(`QualWeb evaluation failed: ${errorMsg}`);
    } finally {
      await this.stopQualWeb(qualweb);
    }
  }
}