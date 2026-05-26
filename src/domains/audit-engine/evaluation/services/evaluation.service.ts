import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Evaluation, EvaluationContext } from "../entities/evaluation.entity";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { InjectQueue } from "@nestjs/bullmq";
import { EvaluationQueryDTO } from "../dto/request/evaluation-request.dto";
import { Page } from "src/domains/inventory/page/page.entity";
import {
  EvaluationResult,
  EvaluationResultDocument,
} from "../entities/evaluation-result.entity";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { SecurityContext } from "src/core/authorization/SecurityContext";
import { FgaService } from "src/core/authorization/fga.service";

import { EvaluationStorageService } from "../evaluation-storage.service";
import { In } from "typeorm/find-options/operator/In.js";
import { EvaluationRequestDTO } from "../dto/EvaluationRequest.dto";
import { RoleSlug } from "src/core/authentication/interfaces/types";

@Injectable()
export class EvaluationService {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    @InjectModel(EvaluationResult.name)
    private readonly resultModel: Model<EvaluationResultDocument>,
    @InjectRepository(Page) private readonly pageRepository: any,
    @InjectQueue("evaluation-queue-public") 
    private readonly publicEvaluationQueue: any,
    @InjectQueue("evaluation-queue-private")
    private readonly privateEvaluationQueue: any,
    private readonly logger: AppLoggerService,

    private readonly evaluationStorageService: EvaluationStorageService
  ) {
    this.logger.setContext(EvaluationService.name);
  }

  public async getEvaluations(pageId: number,securityContext: SecurityContext, query: EvaluationQueryDTO ): Promise<{ data: Evaluation[]; count: number }> {
    
      return await this.evaluationRepository.getManyEvaluationsAMS(pageId, { filters: query.filters, sortings: query.sorts, pagination: query.pagination, securityContext });
  }

  
  public async getEvaluationById(pageId: number, evaluationId: number, securityContext: SecurityContext): Promise<Evaluation> {

    return this.evaluationRepository.getOrmRepository().findOneByOrFail({ id: evaluationId });
  }

  public async evaluateWebsite(websiteId: number, securityContext: SecurityContext): Promise<void> {

    const pages: Page[] = await this.pageRepository.find({ where: { websiteId: websiteId } });
    if (!pages || pages.length === 0) {
      throw new NotFoundException(`No pages found for website with ID ${websiteId}`);
    }
    const pageIds = pages.map(page => page.id);

    await this.evaluateManyPages({ websiteId, pagesIds: pageIds, userId: securityContext.user.id }, securityContext);
  }
  
  public async evaluateHtml(html: string): Promise<any> {
    throw new NotFoundException("Not implemented yet");
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
      newEvaluation.context = EvaluationContext.ADMIN_AMS
      newEvaluation.createdById = request.userId!;
      newEvaluation.ownerSubjectId = request.userId!;
      newEvaluation.ownerType = 1; 
      return newEvaluation;
    });
   const result = await this.evaluationRepository.saveMany(WebsiteEvaluations);
   if (!result) throw new InternalServerErrorException("Failed to create evaluations for the website pages");

    // create tuple of this user as creator
    /// create tuple of institution  with evaluation 

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

  async savePageEvaluation(
    websiteId: number,
    evaluationId: number,
    pageId: number,
    result: any,
    userId: number,
  ): Promise<any> {
    const evaluation = await this.evaluationRepository.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found`,
      );
    }

    await this.saveEvaluationMetadata(evaluationId, result);


    evaluation.pageTitle = result.data.title
      .replace(/"/g, "")
      .replace(/[\u0800-\uFFFF]/g, "");
    evaluation.score = result.data.score;
    const conform = result.data.conform.split("@");
    evaluation.A = conform[0];
    evaluation.AA = conform[1];
    evaluation.AAA = conform[2];
    evaluation.createdAt = new Date(result.data.date);

    await this.evaluationRepository.save(evaluation);
  

    
    this.evaluationStorageService.saveEvaluation(
      {
        evaluationId: evaluation.id,
        websiteId: websiteId.toString(),
        pageId: evaluation.pageId.toString(),
        date: evaluation.createdAt.toISOString().split('T')[0],
      },
      result.pagecode,
      result.data.nodes,
    );
  }



  async saveEvaluationHtml(
    evaluationId: number,
    html: string,
  ): Promise<void> {
    
  }

  async saveExternalEvaluation(
    securityContext: SecurityContext,
    pageId: number,
    data: string,
  ): Promise<any> {

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

  async getEvaluationResultJson(pageId: number, evaluationId: number, securityContext: SecurityContext): Promise<any> {

    const evaluation = await this.evaluationRepository.findById(evaluationId);
  
    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found`,
      );
    }

  
    const nodesPath = await this.evaluationStorageService.getEvaluationNodesPath(
      {
      evaluationId: evaluation.id,
      websiteId: evaluation.pageId.toString(), 
      pageId: evaluation.pageId.toString(),
      date: evaluation.createdAt.toISOString().split('T')[0],
    });

    return nodesPath;
  }

    async getEvaluationHtml(pageId: number, evaluationId: number, securityContext: SecurityContext): Promise<any> {

    const evaluation = await this.evaluationRepository.findById(evaluationId);
  
    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found`,
      );
    }

  
    const htmlPath = await this.evaluationStorageService.getEvaluationHtmlPath(
      {
      evaluationId: evaluation.id,
      websiteId: evaluation.pageId.toString(), 
      pageId: evaluation.pageId.toString(),
      date: evaluation.createdAt.toISOString().split('T')[0],
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

  private async saveEvaluationMetadata(
    evaluationId: number,
    result: any,
  ): Promise<void> {
    const mongoDoc: any = await this.resultModel.create({
      evaluationId,
      url: result.data.rawUrl,
      tot: result.data.tot,
      errors: result.data.elems,
      elements: result.data.elems,
      tagCount: result.data.tot.info.cTags,
    });
    const resultmongoDoc = await mongoDoc.save();
    if (!resultmongoDoc) {
      throw new NotFoundException(
        `Failed to save evaluation result for Evaluation ID ${evaluationId}`,
      );
    }
  }

  async evaluatePublicRequest( url: string ): Promise<any> {
    throw new NotFoundException("Not implemented yet");
  }

}
