export interface IEvaluationEngine {
  evaluate(url: string): Promise<any>;
}

export const IEvaluationEngine = Symbol('IEvaluationEngine');