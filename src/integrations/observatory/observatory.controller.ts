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
  
  @Get("websites/:id")
  @HttpCode(200)
  async getWebsiteMetrics( @Param('id',ParseIntPipe)  id: number): Promise<any> {
    const data = await this.observatoryService.getWebsiteMetrics(id);
    return data;
  }
  
}
