import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  StreamableFile,
  Response,
} from '@nestjs/common';
import { AnalyticsDocs } from './analytics.swagger';
import type { Response as ExpressResponse } from 'express';
import { AnalyticsService } from './analytics.service';
import { RoleSlug } from 'src/core/authentication/interfaces/types';

import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { Roles } from 'src/core/authorization/decorators/roles.decorator';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { AMS_ROLE_VIEWER } from 'src/core/authorization/policies/role.policies';
import { ExportAnalyticsParamsDto } from './dto/export-analytics.dto';

@AnalyticsDocs.controller()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
@Roles(RoleSlug.ADMIN)
@FgaAuthorized(AMS_ROLE_VIEWER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @AnalyticsDocs.getOverview()
  @Get('overview')
  async getOverview() {
    return this.analyticsService.getAdminOverview();
  }

  @AnalyticsDocs.getGlobalMetrics()
  @Get('global')
  @HttpCode(HttpStatus.OK)
  async getGlobalMetrics() {
    return this.analyticsService.getGlobalMetrics();
  }

  @AnalyticsDocs.exportAnalytics()
  @Get('export/:context/format/:format')
  @HttpCode(HttpStatus.OK)
  async exportAnalytics(
    @Param() params: ExportAnalyticsParamsDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const { stream, contentType, filename } = await this.analyticsService.exportAnalytics(
      params.context,
      params.format,
    );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    return new StreamableFile(stream);
  }
}
