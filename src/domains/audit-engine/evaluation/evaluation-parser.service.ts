import { Injectable, Logger } from '@nestjs/common';
import {
  processEvaluation,
  getRuleMetadata,
  EvaluationProcessingResult,
} from '@a12e/accessmonitor-rulesets';
import { createEvaluationEntity } from './evaluation-metrics.domain';
import { generateMd5Hash } from 'src/common/security';
import {
  AuditReport,
  ConformanceResultToken,
  ConformanceToken,
  EvaluationScoring,
  IMetricData,
} from './types';

@Injectable()
export class EvaluationParserService {
  constructor(private readonly logger: Logger) {}

  public parseEvaluation(evaluation): {
    evaluationReport: AuditReport;
    evaluationData: EvaluationScoring;
  } {
    if (!evaluation || typeof evaluation !== 'object') {
      throw new Error('Invalid evaluation: evaluation payload must be a non-null object.');
    }

    if (!evaluation.system || !evaluation.system.page || !evaluation.system.page.dom) {
      throw new Error(
        `Invalid QualWeb payload structure for job: missing 'system.page.dom'. Raw payload type: ${evaluation.type || 'unknown'}`,
      );
    }
    try {
      const evaluationProcessed: EvaluationProcessingResult = processEvaluation(evaluation);
      const hash = generateMd5Hash(evaluationProcessed.metadata.metadata.evaluatedAt);

      const report: AuditReport = {
        metadata: evaluationProcessed.metadata.metadata,
        snapshot: {
          html: evaluationProcessed.html.html,
          sizeInBytes: evaluationProcessed.html.pageSize,
          hash: hash,
        },
        telemetry: {
          elementCounters: evaluationProcessed.elementCounters,
          roles: evaluationProcessed.metadata.telemetry.roles,
          tagCounter: evaluationProcessed.metadata.telemetry.tagCounter,
          totalHtmlTags: evaluationProcessed.metadata.telemetry.totalHtmlTags,
        },
        scoring: {
          conform: evaluationProcessed.scoreDetails.conform as ConformanceToken,
          totalTests: evaluationProcessed.scoreDetails.totalTests,
          score: evaluationProcessed.scoreDetails.score,
          rulesOccurrences: evaluationProcessed.rulesOccurrences,
          assertionEvidence: evaluationProcessed.assertionEvidence,
          conformanceResults: evaluationProcessed.conformanceResults as Record<
            string,
            ConformanceResultToken
          >,
        },
      };

      const evaluationData = createEvaluationEntity(report);

      return { evaluationReport: report, evaluationData };
    } catch (error) {
      throw new Error(
        `Failed to parse evaluation: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  public parseIngestionMetrics(
    evaluationId: number,
    directoryIds: number[],
    institutionId: number,
    websiteId: number,
    pageId: number,
    score: string,
    evaluationDate: string,
    metrics: Record<string, number>,
  ): IMetricData[] {
    return Object.entries(metrics)
      .map(([key, value]) => {
        try {
          const { rule_id, rule_result } = getRuleMetadata(key);
          return {
            evaluation_id: evaluationId,
            directories_ids: directoryIds,
            institution_id: institutionId,
            website_id: websiteId,
            page_id: pageId,
            evaluation_date: evaluationDate,
            score: Number(score),
            rule_id: rule_id,
            count: Number(value),
            rule_result: rule_result,
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
