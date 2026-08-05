import {  ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Evaluation } from "../entities/evaluation.entity";
import { EvaluationRepository } from "../evaluation.repository";
import { InjectQueue } from "@nestjs/bullmq";
import { EvaluationQueryDTO } from "../dto/request/evaluation-request.dto";
import { Page } from "src/domains/inventory/page/page.entity";

import { InjectRepository } from "@nestjs/typeorm";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { SecurityContext } from "src/core/authorization/SecurityContext";

import { EvaluationStorageService } from "../evaluation-storage.service";
import { In } from "typeorm/find-options/operator/In.js";
import { EvaluationRequestDTO } from "../dto/EvaluationRequest.dto";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { EvaluationProducer } from "../redis/evaluation.producer";
import { FgaService } from "src/core/authorization/fga.service";

@Injectable()
export class EvaluationService {
  constructor(
    
    private readonly evaluationRepository: EvaluationRepository,
    private readonly fgaService: FgaService,
    @InjectRepository(Page) private readonly pageRepository: any,
    private readonly evaluationProducer: EvaluationProducer,
    @InjectQueue("evaluation-queue-public") 
    private readonly publicEvaluationQueue: any,
    @InjectQueue("evaluation-queue-private")
    private readonly privateEvaluationQueue: any,
    private readonly logger: AppLoggerService,
    private readonly evaluationStorageService: EvaluationStorageService

  ) {
    this.logger.setContext(EvaluationService.name);
  }

  public async getEvaluations(websiteId: number, pageId: number, securityContext: SecurityContext, query: EvaluationQueryDTO ): Promise<{ data: Evaluation[]; count: number }> {
    
      return await this.evaluationRepository.getManyEvaluations(websiteId, pageId, { filters: query.filters, sortings: query.sorts, pagination: query.pagination, securityContext , contexts: query.contexts ? query.contexts : [] });
  }
  
  public async getEvaluationById(websiteId: number, pageId: number, evaluationId: number, securityContext: SecurityContext): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findEvaluationById(websiteId, pageId, evaluationId, securityContext);
    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${evaluationId} not found`);
    }
    return evaluation;
  }

  public async evaluateWebsite(websiteId: number, securityContext: SecurityContext): Promise<void> {

    const pages: Page[] = await this.pageRepository.find({ where: { websiteId: websiteId } });
    if (!pages || pages.length === 0) {
      throw new NotFoundException(`No pages found for website with ID ${websiteId}`);
    }
    const pageIds = pages.map(page => page.id);

    await this.evaluateManyPages({ websiteId, pagesIds: pageIds, userId: securityContext.user.id }, securityContext);
  }


  public async evaluateManyPages(
    request: EvaluationRequestDTO,
    securityContext: SecurityContext
  ): Promise<void> {
    if (!(request.pagesIds.length > 0)) throw new NotFoundException();
    // TODO, permitido a todos os utilizadores. No entanto há uma divergencia de logica, se for do AMP não salva
    console.log("evaluateManyPages called with request:", request);
    // else validate if pages exists
    const pages = await this.pageRepository.find({
          where: {
          id: In(request.pagesIds),      
           websiteId: request.websiteId 
       }
       });
    // Create Evaluation and send evaluation id to queue
    
    const WebsiteEvaluations: Evaluation[] = pages.map((page) => {
      const newEvaluation = new Evaluation();
      newEvaluation.pageId = page.id;
      newEvaluation.createdById = request.userId!;

      return newEvaluation;
    });
    
   const result = await this.evaluationRepository.createManyEvaluations(WebsiteEvaluations, securityContext.user.context.id);
   if (!result) throw new InternalServerErrorException("Failed to create evaluations for the website pages");
 

    const jobs = WebsiteEvaluations.map(evaluation => ({

      name: 'evaluation-job',
      data: { 
        websiteId: request.websiteId, 
        evaluationId: evaluation.id,
        pageId: evaluation.pageId,
        userId: request.userId
      }
    }));

    securityContext.user.role_slug == RoleSlug.ADMIN
      ? this.privateEvaluationQueue.addBulk(jobs)
      : this.publicEvaluationQueue.addBulk(jobs);
  }


  async saveExternalEvaluation(
    websiteId: number,
    pageId: number,
    data: string,
    securityContext: SecurityContext
  ): Promise<any> {

    const page = await this.pageRepository.findOne({ where: { id: pageId, websiteId: websiteId } });
    if (!page) {
      throw new NotFoundException(`Page with ID ${pageId} not found`);
    }
    const splittedData = data.split(";");
     
    const newEvaluation = new Evaluation();
    newEvaluation.pageId = pageId;

    newEvaluation.score = splittedData[8].replace(",", ".");
    
    newEvaluation.A = parseInt(splittedData[2].split("@")[0]);
    newEvaluation.AA = parseInt(splittedData[2].split("@")[1]);
    newEvaluation.AAA = parseInt(splittedData[2].split("@")[2]);
    newEvaluation.createdAt = new Date(splittedData[9]);
    newEvaluation.createdById = securityContext.user.id;

    await this.evaluationRepository.save(newEvaluation);
  }

  async getEvaluationResultJson(websiteId: number, pageId: number, evaluationId: number, securityContext: SecurityContext): Promise<any> {

    const evaluation = await this.evaluationRepository.findEvaluationById(websiteId, pageId, evaluationId, securityContext);
  
    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found`,
      );
    }

  
    const nodesPath = await this.evaluationStorageService.getEvaluationNodesPath(
      {
      evaluationId: evaluation.id,
      websiteId: websiteId.toString(), 
      pageId: evaluation.pageId.toString(),
      evaluationDate: evaluation.createdAt.toISOString().split('T')[0],
    });

    return nodesPath;
  }

    async getEvaluationHtml(websiteId: number, pageId: number, evaluationId: number, securityContext: SecurityContext): Promise<any> {

    const evaluation = await this.evaluationRepository.findEvaluationById(websiteId, pageId, evaluationId, securityContext);
  
    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found`,
      );
    }

  
    const htmlPath = await this.evaluationStorageService.getEvaluationHtmlPath(
      {
      evaluationId: evaluation.id,
      websiteId: websiteId.toString(), 
      pageId: evaluation.pageId.toString(),
      evaluationDate: evaluation.createdAt.toISOString().split('T')[0],
    });

    return htmlPath;
  }



  public prepareReport(params: any): object {
    return {
      pagecode: Buffer.from(params.Pagecode, "base64").toString(),
      data: {
        title: params.Title,
        score: params.Score,
        rawUrl: params.Uri,
        tot: params.Tot,
        nodes: params.Nodes,
        conform: params.Conform,
        elems: params.Elems,
        date: params.Date,
      },
    };
  }

}


