import {
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ObservatoryService } from "./observatory.service";
import { AuthGuard } from "@nestjs/passport";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Observatory } from "./observatory.entity";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";

@ApiBasicAuth()
@ApiTags("observatory")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("observatory")
@UseInterceptors(LoggingInterceptor)
export class ObservatoryController {
  constructor(private readonly observatoryService: ObservatoryService) {}

  @ApiOperation({ summary: "Get all observatory data" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Observatory,
  })
  @Get("all")
  @HttpCode(200)
  async findAll(): Promise<any> {
    const data = await this.observatoryService.findAll();
    return data;
  }

  @ApiOperation({ summary: "Get latest observatory data" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Observatory,
  })
  @Get()
  @HttpCode(200)
  async getData(): Promise<any> {
    const data = await this.observatoryService.getObservatoryData();
    return data;
  }


  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles("admin")
  @Post("generate")
  @HttpCode(204)
  async generateData(): Promise<any> {
 
      await this.observatoryService.generateData(true);

  }


  @Get("sync-status")
  @HttpCode(200)
  async getSyncStatus(): Promise<any> {
      const status = await this.observatoryService.getSyncStatus();
      return status;
  }


  @HttpCode(200)
  @Get("is-sync-running")
  async isSyncRunning(): Promise<any> {

      const isRunning = await this.observatoryService.isSyncRunning();
      return ({ isRunning });
 
  }

  @Get("running-sync-status")
  @HttpCode(200)

  async getCurrentRunningSyncStatus(): Promise<any> {

      const status =
        await this.observatoryService.getCurrentRunningSyncStatus();
      return status;

  }
}
