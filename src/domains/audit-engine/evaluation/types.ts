export interface EvaluationFileMetadata {
  timestamp: string;
  storageReference: string;
  integrityHash: string;
}
export interface EvaluationIdentifier {
  evaluationId: number;
  websiteId: number;
  pageId: number;
  evaluationDate: string;
}

export interface IMetricData {
  evaluation_id: number;
  directory_id: number;
  institution_id: number;
  website_id: number;
  page_id: number;
  evaluation_date: string;
  score: number;
  rule_id: string;
  count: number;
  rule_score: number;
  rule_trust: number;
  rule_type: string;
}


export interface  PageMetadata {
  websiteId:number;
  pageId:number,
  url:string
}

export interface EvaluationMeta{
  evaluationId:number;
}

export interface AdditionalMetadata {
  institutionId:number;
  //directoryId:number;
}

export interface EvaluationJobData extends EvaluationMeta, PageMetadata, AdditionalMetadata {}


export interface SafePaths {
  targetDir: string;
  baseFileName: string;
}
export type EvaluationFileType = 'html' | 'nodes';




export interface ConformanceErrors {
  A: number;
  AA: number;
  AAA: number;
}

export interface EvaluationReport {
  pagecode: string;
  evaluationData:EvaluationScoring,
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

export interface EvaluationScoring {
  title: string;
  score: string;
  A: number;
  AA: number;
  AAA: number;
  createdAt: string;
}

