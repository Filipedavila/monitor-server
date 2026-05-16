import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
  Res,
  HttpCode,
  Body,
  Query,
  HttpStatus,
} from "@nestjs/common";
import { EvaluationService } from "../services/evaluation.service";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { EvaluationDocs } from "../evaluation.swagger";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { EvaluationQueryDTO } from "../dto/request/evaluation-request.dto";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { NestedQuery } from "src/common/query-parser.decorator";
import { Response } from 'express';
import { createReadStream } from "node:fs";
@EvaluationDocs.controller()
@Controller("evaluations")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)

export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}


  @EvaluationDocs.findAll()
  @Roles(RoleSlug.ADMIN)
  @Get("page/:pageIdEval")
  async findAllAMSEval(@CurrentUser() user: AuthenticatedUser, @Param("pageIdEval") pageId: number, @NestedQuery() query: EvaluationQueryDTO): Promise<any> {
    const securityContext = { user: user };
    console.log("Received query in controller:", query); // Log para depuração
    return await this.evaluationService.getEvaluations(pageId, securityContext, query);
  }

  @EvaluationDocs.findOne()
  @Roles(RoleSlug.ADMIN)
  @Get("page/:pageId/evaluation/:evaluationId")
  async findOne(@Param("pageId") pageId: number, @Param("evaluationId") evaluationId: number, @CurrentUser() user: AuthenticatedUser): Promise<any> {
    const securityContext = { user: user };
    return await this.evaluationService.getEvaluationById(pageId, evaluationId, securityContext);
  }
  
  @EvaluationDocs.findPageEvaluationDetails()
  @Get("/results/page/:pageId/evaluation/:evaluationId")
  async getPageEvaluationDetails(
    @Request() req: any,
    @Param("pageId") pageId: number,
    @Param("evaluationId") evaluationId: number,
    @Res() res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext = { user: user };
    const nodes = await this.evaluationService.getEvaluationResultJson(pageId, evaluationId, securityContext);
    res.set({
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip',
    'Content-Disposition': 'inline', 
  });

  const fileStream = createReadStream(nodes);
  
  fileStream.on('error', (err) => {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Erro ao ler storage' });
  });

  fileStream.pipe(res);
  }

    @EvaluationDocs.findPageEvaluationDetails()
  @Get("/results/page/:pageId/html/:evaluationId")
  async getPageEvaluationHtml(
    @Request() req: any,
    @Param("pageId") pageId: number,
    @Param("evaluationId") evaluationId: number,
    @Res() res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext = { user: user };
    const html = await this.evaluationService.getEvaluationHtml(pageId, evaluationId, securityContext);
    res.set({
    'Content-Type': 'text/html',
    'Content-Encoding': 'gzip',
    'Content-Disposition': 'inline', 
  });

  const fileStream = createReadStream(html);
  
  fileStream.on('error', (err) => {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Erro ao ler storage' });
  });

  fileStream.pipe(res);
  }

  @EvaluationDocs.uploadExternalEvaluation()
  @Post("external/:pageId")
  async uploadExternalEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param("pageId") pageId: number,
    @Body() data: any,
  ): Promise<any> {   
    const securityContext = { user: user };
    return await this.evaluationService.saveExternalEvaluation(
      securityContext,
      pageId,
      data,
    );
  }

  @Post(":websiteId")
  async evaluateManyPages(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId") websiteId: number,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.evaluationService.evaluateWebsite(websiteId, securityContext);
  }


}
  