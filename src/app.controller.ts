import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppService } from "./app.service";
import { AppDocs } from "./app.swagger";
import { JwtAuthGuard } from "./core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "./core/authorization/guards/roles.guard";
import { Roles } from "./core/authorization/decorators/roles.decorator";

@AppDocs.controller()
@Controller()
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles("admin")
export class AppController {
  constructor(private readonly appService: AppService) {}


  @AppDocs.getObservatoryStats()
  @Get("admin/stats/observatory")
  async getObservatoryStats(): Promise<any> {
    return await this.appService.getObservatoryStats();
  }

  @AppDocs.getTotalStats()
  @Get("admin/stats/totals")
  async getTotalStats(): Promise<any> {
    return await this.appService.getTotalStats();
  }

  @AppDocs.getMyMonitorStats()
  @Get("admin/stats/mymonitor")
  async getMyMonitorStats(): Promise<any> {
    return await this.appService.getMyMonitorStats();
  }

  @AppDocs.getTotalsData()
  @Get("totals")
  async getTotalsData(): Promise<any> {
    return await this.appService.getTotalsData();
  }

  @AppDocs.getTotalsPracticesData()
  @Get("totals/practices")
  async getTotalsPracticesData(): Promise<any> {
    return await this.appService.getTotalsPracticesData();
  }
}