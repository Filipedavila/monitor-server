import { EvaluationScoring, IMetricData } from "../types";

export interface EvaluationPersisterPayload {
  evaluationId: number;
  websiteId:number;
  directoryId:number;
  institutionId:number;
  evaluationMetrics: IMetricData[];
  basicResult: EvaluationScoring;
}

export interface EvaluationPersister {
  persist(payload: EvaluationPersisterPayload): Promise<void>;
}


export const EvaluationPersister = Symbol('EvaluationPersister');