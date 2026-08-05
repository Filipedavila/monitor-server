import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from 'src/domains/inventory/page/page.entity';
import { EvaluatePageHandler } from './evaluate-page.handler'; 
import { SaveEvaluationHandler } from './save-evaluation.handler';
import { EvaluationProducer } from '../redis/evaluation.producer';

@Injectable()
export class ProcessEvaluationOrchestrator {
  constructor(
    @InjectRepository(Page) private readonly pageRepository: Repository<Page>,
    private readonly evaluatePageHandler: EvaluatePageHandler,
    private readonly saveEvaluationHandler: SaveEvaluationHandler,
  ) {}

  async execute(
    websiteId: number,
    evaluationId: number,
    pageId: number,
    url?: string,
  ): Promise<any> {
    let urlToEvaluate = url;

    if (!urlToEvaluate) {
      const page = await this.pageRepository.findOne({ where: { id: pageId } });
      if (!page) {
        throw new NotFoundException(`Page with ID ${pageId} not found`);
      }
      urlToEvaluate = page.url;
    }

    const evaluationResult = await this.evaluatePageHandler.execute(urlToEvaluate);

    return await this.saveEvaluationHandler.execute(
      websiteId,
      evaluationId,
      pageId,
      evaluationResult
    );
  }
}