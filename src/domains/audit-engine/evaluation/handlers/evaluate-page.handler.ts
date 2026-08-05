import { Inject, Injectable } from '@nestjs/common';
import { IEvaluationEngine } from '../types/evaluation-engine.interface'; 

@Injectable()
export class EvaluatePageHandler {
  constructor(
    @Inject(IEvaluationEngine)
    private readonly evaluationEngine: IEvaluationEngine,
  ) {}

  async execute(url: string): Promise<any> {
    return await this.evaluationEngine.evaluate(url);
  }  
}