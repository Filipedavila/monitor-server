export interface EvaluationEngine {
  evaluate(url: string): Promise<any>;
}

export const EvaluationEngine = Symbol('EvaluationEngine');