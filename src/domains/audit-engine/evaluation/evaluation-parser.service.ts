import { Injectable, Logger } from '@nestjs/common';
import { getElementsMapping, generateScore, getRuleMetadata } from '@a12e/accessmonitor-rulesets';
import { formatDate } from 'src/common/utils/date.util';
import {
  calculateConform,
  calculatePageSize,
  calculateTotalElements,
  createEvaluationData,
} from './evaluation-metrics.domain';
import { generateMd5Hash } from 'src/common/security';
import { EvaluationReport, IMetricData } from './types';

const ENCODING_UTF8 = 'utf-8';
const CONTENT_TYPE_HTML = 'text/html';

@Injectable()
export class EvaluationParserService {
  constructor(private readonly logger: Logger) {}
  public parseEvaluation(evaluation: any): EvaluationReport {
    if (!evaluation || typeof evaluation !== 'object') {
      throw new Error('Invalid evaluation: evaluation payload must be a non-null object.');
    }

    if (!evaluation.system || !evaluation.system.page || !evaluation.system.page.dom) {
      throw new Error(
        `Invalid QualWeb payload structure for job: missing 'system.page.dom'. Raw payload type: ${evaluation.type || 'unknown'}`,
      );
    }
    try {
      const { elements, results, nodes, metrics } = getElementsMapping(evaluation);
      const pagecodeRaw = evaluation.system.page.dom.html;

      const pagecode = pagecodeRaw;
      const title = evaluation.system.page.dom.title;
      const completeUrl = evaluation?.system?.url?.completeUrl || '';
      const tags = evaluation?.modules?.counter?.data?.tags || {};
      const roles = evaluation?.modules?.counter?.data?.roles || {};

      if (!pagecode) {
        throw new Error('Missing page HTML content');
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
        evaluationData: {} as any,
        data: {
          title: title || '',
          rawUrl: completeUrl,
          elems: elements,
          nodes,
          date: currentDate,
          metrics,
          conform,
          score: 0,
          tot: {
            info: {
              url: completeUrl,
              title: title || '',
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
              score: 0,
            },
            elems: elements,
            results: safeResults,
          },
        },
      };

      const score = Number(generateScore(report as any));
      const evaluationData = createEvaluationData(title, conform, score.toString(), currentDate);
      report.evaluationData = evaluationData;
      report.data.score = score;
      report.data.tot.info.score = score;

      return report;
    } catch (error) {
      throw new Error(
        `Failed to parse evaluation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public parseIngestionMetrics(
    evaluationId: number,
    directoryId: number,
    institutionId: number,
    websiteId: number,
    pageId: number,
    score: number,
    evaluationDate: string,
    metrics: any,
  ): IMetricData[] {
    return Object.entries(metrics)
      .map(([key, value]) => {
        try {
          const { rule_id, rule_trust, rule_type, rule_score } = getRuleMetadata(key);
          return {
            evaluation_id: evaluationId,
            directory_id: directoryId,
            institution_id: institutionId,
            website_id: websiteId,
            page_id: pageId,
            evaluation_date: evaluationDate,
            score: score,
            rule_id: rule_id,
            count: Number(value),
            rule_trust: Number(rule_trust),
            rule_type: rule_type,
            rule_score: rule_score,
          };
        } catch (error) {
          this.logger.error(
            `Failed to parse metric for rule ${key}: ${error instanceof Error ? error.message : String(error)}`,
          );
          return null;
        }
      })
      .filter((item) => item !== null);
  }
}
