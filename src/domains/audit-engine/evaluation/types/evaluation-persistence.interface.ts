export interface IEvaluationPersistence {
  save(websiteId: number, evaluationId: number, pageId: number, result: any): Promise<any>;
}

export const IEvaluationPersistence = Symbol('IEvaluationPersistence');