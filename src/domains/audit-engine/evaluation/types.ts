
export interface EvaluationResult {
  passed: number;
  failed: number;
  warning: number;
}


export interface EvaluationTest {
  evaluationId: number;
  directoryId: number;
  websiteId: number;
  page_id: number;
  entity_id: number;
  evaluationDate: Date;
  rule_code: string;
  results: EvaluationResult;
  score: number;
}