import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppService } from "./app.service";
import { AppDocs } from "./app.swagger";

@AppDocs.controller()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @AppDocs.getObservatoryStats()
  @UseGuards(AuthGuard("jwt"))
  @Get("admin/stats/observatory")
  async getObservatoryStats(): Promise<any> {
    return await this.appService.getObservatoryStats();
  }

  @AppDocs.getTotalStats()
  @UseGuards(AuthGuard("jwt"))
  @Get("admin/stats/totals")
  async getTotalStats(): Promise<any> {
    return await this.appService.getTotalStats();
  }

  @AppDocs.getMyMonitorStats()
  @UseGuards(AuthGuard("jwt"))
  @Get("admin/stats/mymonitor")
  async getMyMonitorStats(): Promise<any> {
    return await this.appService.getMyMonitorStats();
  }

  @AppDocs.getTotalsData()
  @UseGuards(AuthGuard("jwt"))
  @Get("totals")
  async getTotalsData(): Promise<any> {
    return await this.appService.getTotalsData();
  }

  @AppDocs.getTotalsPracticesData()
  @UseGuards(AuthGuard("jwt"))
  @Get("totals/practices")
  async getTotalsPracticesData(): Promise<any> {
    return await this.appService.getTotalsPracticesData();
  }
}