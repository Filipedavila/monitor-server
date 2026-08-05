
/*export interface EvaluationResult {
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
}*/

export interface EvaluationFileMetadata {
  timestamp: string;
  storageReference: string;
  integrityHash: string;
}
export interface EvaluationIdentifier {
  evaluationId: number;
  websiteId: string;
  pageId: string;
  evaluationDate: string;
}

export interface IMetricData {
  evaluation_id: number;
  directory_id: number;
  institution_id: number;
  website_id: number;
  page_id: number;
  evaluation_date: string;
  score: string;
  rule_id: string;
  count: number;
  rule_weight: number;
  rule_trust: number;
  rule_type: string;
}