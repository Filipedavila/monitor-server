// src/domains/audit-engine/evaluation/evaluation-parser.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { getRuleMetadata } from '@a12e/accessmonitor-rulesets';
import { createEvaluationEntity } from './evaluation-metrics.domain';
import { AuditReport, EvaluationScoring, IMetricData } from './types';

@Injectable()
export class EvaluationParserService {
  constructor(private readonly logger: Logger) {}

  public parseEvaluation(leanReport: AuditReport): {
    evaluationReport: AuditReport;
    evaluationData: EvaluationScoring;
  } {
    if (!leanReport || typeof leanReport !== 'object') {
      throw new Error('Invalid evaluation: evaluation payload must be a non-null object.');
    }

    try {
      const evaluationData = createEvaluationEntity(leanReport);
      return { evaluationReport: leanReport, evaluationData };
    } catch (error) {
      throw new Error(
        `Failed to parse evaluation entity: ${error instanceof Error ? error.message : String(error)}`,
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
