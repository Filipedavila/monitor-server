import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { ObservatoryService } from './observatory.service';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';
import { ApiBasicAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ObservatoryDocs } from './observatory.swagger';

ObservatoryDocs.controller();
@Controller('observatory')
@UseInterceptors(LoggingInterceptor)
export class ObservatoryController {
  constructor(private readonly observatoryService: ObservatoryService) {}

  @ObservatoryDocs.getGlobalMetrics()
  @Get('')
  @HttpCode(200)
  async getGlobalMetrics(): Promise<any> {
    const data = await this.observatoryService.getGlobalMetrics();
    return data;
  }

  @ObservatoryDocs.getDirectoriesRanks()
  @Get('directories')
  @HttpCode(200)
  async getDirectoriesRanks(): Promise<any> {
    const data = await this.observatoryService.getDirectoriesStatistics();
    return data;
  }

  @ObservatoryDocs.getDirectoryWebsites()
  @Get('directories/:id/websites')
  @HttpCode(200)
  async getDirectoryWebsites(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getDirectoryWebsites(id);
    return data;
  }

  @ObservatoryDocs.getDirectoryStatistics()
  @Get('directories/:id/statistics')
  @HttpCode(200)
  async getDirectoryStatistics(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getDirectoryStatistics(id);
    return data;
  }

  @ObservatoryDocs.searchWebsites()
  @Get('websites/search')
  @HttpCode(200)
  async searchWebsites(@Query('query') query: string): Promise<any> {
    const data = await this.observatoryService.searchWebsites(query);
    return data;
  }

  @ObservatoryDocs.getWebsiteMetrics()
  @Get('websites/:id')
  @HttpCode(200)
  async getWebsiteMetrics(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getWebsiteMetrics(id);
    return data;
  }
}
