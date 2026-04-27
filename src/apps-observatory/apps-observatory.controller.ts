import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AppsObservatoryService } from "./apps-observatory.service";
import { success, error } from "../lib/response";
import { AuthGuard } from "@nestjs/passport";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AppsObservatory } from "./apps-observatory.entity";

@ApiBasicAuth()
@ApiTags("apps-observatory")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("apps-observatory")
@UseInterceptors(LoggingInterceptor)
export class AppsObservatoryController {
  constructor(private readonly appsObservatoryService: AppsObservatoryService) {}

  @ApiOperation({ summary: "Get all apps observatory data" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: AppsObservatory,
  })
  @Get("all")
  async findAll(): Promise<any> {
    const data = await this.appsObservatoryService.findAll();
    return success(data);
  }

  @ApiOperation({ summary: "Get latest observatory data" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: AppsObservatory,
  })
  @Get()
  async getData(): Promise<any> {
    const data = await this.appsObservatoryService.getObservatoryData();
    return success(data);
  }

  @ApiOperation({ summary: "Synchronize apps observatory data" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("synchronize")
  async synchronizeData(): Promise<any> {
    try {
      this.appsObservatoryService.synchronizeData(true);
      return success();
    } catch (err) {
      return error(err);
    }
  }
}
