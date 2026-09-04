import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  UseInterceptors,
  Res,
  Body,
  Query,
  StreamableFile,
  ParseIntPipe,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { EvaluationDocs } from './evaluation.swagger';
import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { EvaluationQueryDTO } from './dto/request/evaluation-request.dto';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { Roles } from 'src/core/authorization/decorators/roles.decorator';
import { Response } from 'express';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { ContextFilterGuard } from 'src/core/authorization/guards/context.guard';
import { AMS_ROLE_MANAGER } from 'src/core/authorization/policies/role.policies';
import { EvaluationTriggerDTO } from './dto/EvaluationTrigger.dto';

@EvaluationDocs.controller()
@Controller('evaluations/')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
@UseInterceptors(LoggingInterceptor)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @EvaluationDocs.findAll()
  @UseGuards(ContextFilterGuard)
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_view',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Get('website/:websiteId/page/:pageId')
  async findAllFromPage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Query() query: EvaluationQueryDTO,
  ): Promise<any> {
    return await this.evaluationService.getEvaluations(websiteId, pageId, { user }, query);
  }

  @EvaluationDocs.findOne()
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_view',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Get('website/:websiteId/page/:pageId/evaluation/:evaluationId')
  async findOne(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext = { user: user };
    return await this.evaluationService.getEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
  }

  @EvaluationDocs.findPageEvaluationDetails()
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_view',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Get('website/:websiteId/page/:pageId/evaluation/:evaluationId/nodes')
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  async getPageEvaluationDetails(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext = { user: user };
    const fileStream = await this.evaluationService.getEvaluationResultJson(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
    res.set({
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(fileStream);
  }

  @EvaluationDocs.findPageEvaluationDetails()
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_view',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Get('website/:websiteId/page/:pageId/evaluation/:evaluationId/html')
  async getPageEvaluationHtml(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext = { user: user };
    const fileStream = await this.evaluationService.getEvaluationHtml(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
    res.set({
      'Content-Type': 'text/html',
      'Content-Encoding': 'gzip',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(fileStream);
  }

  @EvaluationDocs.uploadExternalEvaluation()
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_edit',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Post('website/:websiteId/page/:pageId/evaluation')
  async uploadExternalEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() data: any,
  ): Promise<any> {
    const securityContext = { user: user };
    return await this.evaluationService.saveExternalEvaluation(
      websiteId,
      pageId,
      data,
      securityContext,
    );
  }

  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized(AMS_ROLE_MANAGER)
  @Post('evaluation')
  async triggerGlobalEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() evaluationTriggerDTO: EvaluationTriggerDTO,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.evaluationService.triggerEvaluation(evaluationTriggerDTO, securityContext);
  }

  @FgaAuthorized({
    objectType: 'website',
    action: 'can_edit',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Post('website/:websiteId/evaluate-many-pages')
  async evaluateManyPages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.evaluationService.evaluateWebsite(websiteId, securityContext);
  }
}
