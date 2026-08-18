import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from "@nestjs/common";
import { ObservatoryService } from "./observatory.service";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@ApiBasicAuth()
@ApiTags("observatory")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("observatory")
@UseInterceptors(LoggingInterceptor)
export class ObservatoryController {
  constructor(private readonly observatoryService: ObservatoryService) {}
  
  @Get("")
  @HttpCode(200)
  async getGlobalMetrics(): Promise<any> {
    const data = await this.observatoryService.getGlobalMetrics();
    return data;
  }

  @Get("directories/ranks")
  @HttpCode(200)
  async getDirectoriesRanks(): Promise<any> {
    const data = await this.observatoryService.getDirectoriesRanks();
    return data;
  }

  @Get("directories/statistics")
  @HttpCode(200)
  async getDirectoriesStatistics(): Promise<any> {
    const data = await this.observatoryService.getDirectoriesStatistics();
    return data;
  }
  
  @Get("directories/:id")
  @HttpCode(200)
  async getDirectoryDetails(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getDirectoryDetails(id);
    return data;
  }
  
  @Get("directories/:id/websites")
  @HttpCode(200)
  async getDirectoryWebsites(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getDirectoryWebsites(id);
    return data;
  }

  @Get("directories/:id/statistics")
  @HttpCode(200)
  async getDirectoryStatistics(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getDirectoryStatistics(id);
    return data;
  }


  @Get("websites/:id")
  @HttpCode(200)
  async getWebsiteMetrics( @Param('id',ParseIntPipe)  id: number): Promise<any> {
    const data = await this.observatoryService.getWebsiteMetrics(id);
    return data;
  }
  
}
