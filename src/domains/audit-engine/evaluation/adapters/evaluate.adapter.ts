import { Injectable } from '@nestjs/common';
import { IEvaluationEngine } from '../types/evaluation-engine.interface';
import { executeUrlEvaluation } from '../util/middleware'; 

@Injectable()
export class EvaluationEngineAdapter implements IEvaluationEngine {
  async evaluate(url: string): Promise<any> {
    return await executeUrlEvaluation(url);
  }
}