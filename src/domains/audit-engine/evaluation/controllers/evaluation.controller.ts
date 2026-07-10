import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
  Res,
  Body,
  Query,
  StreamableFile,
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
import { Response } from 'express';
import { createReadStream } from "node:fs";
import { FgaGuard } from "src/core/authorization/guards/fda.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";
import { ContextFilterGuard } from "src/core/authorization/guards/context.guard";


@EvaluationDocs.controller()
@Controller("evaluations")
@UseGuards(JwtAuthGuard, RolesGuard,FgaGuard)
@UseInterceptors(LoggingInterceptor)

export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}


  @EvaluationDocs.findAll()
  @UseGuards(ContextFilterGuard)
  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @Get("page/:pageId")
  async findAllAMSEval(@CurrentUser() user: AuthenticatedUser, @Param("pageId") pageId: number, @Query() query: EvaluationQueryDTO): Promise<any> {
    const securityContext = { user: user };
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
    @Res({ passthrough: true }) res: Response,
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
  
  return new StreamableFile(fileStream);
  }

  @EvaluationDocs.findPageEvaluationDetails()
  @Get("/results/page/:pageId/html/:evaluationId")
  async getPageEvaluationHtml(
    @Request() req: any,
    @Param("pageId") pageId: number,
    @Param("evaluationId") evaluationId: number,
    @Res({ passthrough: true }) res: Response,
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
  
  return new StreamableFile(fileStream);
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

  @FgaAuthorized({
    objectType: "website",
    action: "can_edit",
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId
  })
  @Post(":websiteId")
  async evaluateManyPages(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId") websiteId: number,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.evaluationService.evaluateWebsite(websiteId, securityContext);
  }

}
  