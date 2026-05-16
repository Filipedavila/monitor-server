import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { ApiSeloService } from "./api-selo.service";
import { APISeloDocs } from "./api-selo.swagger";

@APISeloDocs.controller()
@Controller("apiselo")
@UseInterceptors(LoggingInterceptor)
export class APISeloController {
  constructor(private readonly apiSeloService: ApiSeloService) {}

  @APISeloDocs.getAllStamps()
  @Get("all")
  async getAllStamps(): Promise<any> {
    const response = await this.apiSeloService.getAllStamps();
    return response;
  }
}