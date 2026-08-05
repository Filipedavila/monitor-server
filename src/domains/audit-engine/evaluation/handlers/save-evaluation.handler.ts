import { Inject, Injectable } from '@nestjs/common';
import { IEvaluationPersistence } from '../types/evaluation-persistence.interface'; 
@Injectable()
export class SaveEvaluationHandler {
  constructor(
    @Inject(IEvaluationPersistence)
    private readonly evaluationPersistence: IEvaluationPersistence,
  ) {}

  async execute(
    websiteId: number,
    evaluationId: number,
    pageId: number,
    result: any,
  ): Promise<any> {
    return await this.evaluationPersistence.save(websiteId, evaluationId, pageId, result);
  }
}