import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationRepository } from './evaluation.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EvaluationQueryDTO } from './dto/request/evaluation-request.dto';
import { Page } from 'src/domains/inventory/page/page.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { EvaluationStorage } from './types/evaluation-storage.interface';
import { EvaluationRequestDTO } from './dto/EvaluationRequest.dto';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { EvaluationProducer } from './redis/evaluation.producer';
import { ReadStream } from 'node:fs';
import { EvaluationJobData } from './types';
import { Website } from 'src/domains/inventory/website/website.entity';
import { EvaluationTriggerDTO } from './dto/EvaluationTrigger.dto';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    @InjectRepository(Website) private readonly websiteRepository: Repository<Website>,
    @InjectRepository(Page) private readonly pageRepository: Repository<Page>,
    @InjectQueue('evaluation-queue-public') private readonly publicEvaluationQueue: Queue,
    @InjectQueue('evaluation-queue-private') private readonly privateEvaluationQueue: Queue,
    private readonly logger: AppLoggerService,
    @Inject(EvaluationStorage)
    private readonly evaluationStore: EvaluationStorage,
  ) {
    this.logger.setContext(EvaluationService.name);
  }

  public async getEvaluations(
    websiteId: number,
    pageId: number,
    securityContext: SecurityContext,
    query: EvaluationQueryDTO,
  ): Promise<{ data: Evaluation[]; count: number }> {
    return this.evaluationRepository.getManyEvaluations(websiteId, pageId, {
      filters: query.filters,
      sortings: query.sorts,
      pagination: query.pagination,
      securityContext,
      contexts: query.contexts ?? [],
    });
  }

  public async getEvaluationById(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${evaluationId} not found`);
    }
    return evaluation;
  }

  public async evaluateWebsite(websiteId: number, securityContext: SecurityContext): Promise<void> {
    const website = await this.websiteRepository.findOne({ where: { id: websiteId } });
    if (!website) {
      throw new NotFoundException(`Website with ID ${websiteId} not found`);
    }

    const pages = await this.pageRepository.find({ where: { websiteId } });
    if (!pages.length) {
      throw new NotFoundException(`No pages found for website with ID ${websiteId}`);
    }

    await this.evaluateManyPages(
      {
        websiteId,
        pagesIds: pages.map((page) => page.id),
        userId: securityContext.user.id,
      },
      securityContext,
    );
  }

  public async triggerEvaluation(
    evaluationTriggerDTO: EvaluationTriggerDTO,
    securityContext: SecurityContext,
  ): Promise<void> {
    // Implement the logic for triggering evaluation based on the evaluationTriggerDTO
    // ver que tipo de trigger é
  }

  public async evaluateManyPages(
    request: EvaluationRequestDTO,
    securityContext: SecurityContext,
  ): Promise<void> {
    if (!request.pagesIds?.length) {
      throw new BadRequestException('At least one page ID must be provided.');
    }

    this.logger.log(
      `Evaluating ${request.pagesIds.length} pages for website ID: ${request.websiteId}`,
    );

    // Validação estrita de existência de páginas vinculadas ao website
    const pages = await this.pageRepository.find({
      where: {
        id: In(request.pagesIds),
        websiteId: request.websiteId,
      },
    });

    if (pages.length !== request.pagesIds.length) {
      throw new BadRequestException(
        'One or more provided pages do not exist or do not belong to the specified website.',
      );
    }

    const websiteEvaluations = pages.map((page) => {
      const evaluation = new Evaluation();
      evaluation.pageId = page.id;
      evaluation.createdById = securityContext.user.id;
      return evaluation;
    });

    const evaluationTargetMetadata = await this.evaluationRepository.getMetadataForEvaluation(
      request.websiteId,
    );

    const result = await this.evaluationRepository.createManyEvaluations(
      websiteEvaluations,
      securityContext.user.context.id,
    );

    if (!result) {
      throw new InternalServerErrorException('Failed to create evaluations for the website pages');
    }

    const jobs = pages.map((page, index) => ({
      name: 'evaluation-job',
      data: {
        websiteId: request.websiteId,
        institutionId: evaluationTargetMetadata.institutionId,
        directoryIds: evaluationTargetMetadata.directoryIds,
        evaluationId: websiteEvaluations[index].id,
        pageId: page.id,
        url: page.url,
      } ,
      opts: {
        jobId: `evaluation-job-${websiteEvaluations[index].id}`,
      },
    }));

    const targetQueue =
      securityContext.user.role_slug === RoleSlug.ADMIN
        ? this.privateEvaluationQueue
        : this.publicEvaluationQueue;

    await targetQueue.addBulk(jobs);
  }

  public async saveExternalEvaluation(
    websiteId: number,
    pageId: number,
    data: string,
    securityContext: SecurityContext,
  ): Promise<void> {
    const page = await this.pageRepository.findOne({ where: { id: pageId, websiteId } });
    if (!page) {
      throw new NotFoundException(`Page with ID ${pageId} not found`);
    }

    const splittedData = data.split(';');
    if (splittedData.length < 10) {
      throw new BadRequestException('Invalid external evaluation data format.');
    }

    const newEvaluation = new Evaluation();
    newEvaluation.pageId = pageId;
    newEvaluation.score = splittedData[8].replace(',', '.');

    const criteriaParts = splittedData[2].split('@');
    if (criteriaParts.length < 3) {
      throw new BadRequestException('Invalid criteria formatting in external evaluation payload.');
    }

    newEvaluation.A = parseInt(criteriaParts[0], 10) || 0;
    newEvaluation.AA = parseInt(criteriaParts[1], 10) || 0;
    newEvaluation.AAA = parseInt(criteriaParts[2], 10) || 0;
    newEvaluation.createdAt = new Date(splittedData[9]);
    newEvaluation.createdById = securityContext.user.id;

    await this.evaluationRepository.save(newEvaluation);
  }

  public async getEvaluationResultJson(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<ReadStream> {
    const evaluation = await this.getEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );

    return this.evaluationStore.getStream(
      {
        evaluationId: evaluation.id,
        websiteId,
        pageId: evaluation.pageId,
        evaluationDate: evaluation.evaluationDate.toString(),
      },
      'nodes',
    );
  }

  public async getEvaluationHtml(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<ReadStream> {
    const evaluation = await this.getEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );

    return this.evaluationStore.getStream(
      {
        evaluationId: evaluation.id,
        websiteId,
        pageId: evaluation.pageId,
        evaluationDate: evaluation.evaluationDate.toString(),
      },
      'html',
    );
  }
}
