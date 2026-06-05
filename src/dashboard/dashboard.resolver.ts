import { Resolver, Query, ResolveField } from '@nestjs/graphql';
import { DashboardService } from './dashboard.service';
import { DashboardMetrics } from './entities/dashboard-metrics.entity';
import { TopWebsite } from './entities/top-website.entity';
import { BasicMetrics } from './entities/basic-counters.entity';

@Resolver(() => DashboardMetrics)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardMetrics, { name: 'dashboardMetrics' })
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    console.log("Fetching dashboard metrics...");
    const teste =  await this.dashboardService.getMetrics();
    console.log("Dashboard metrics fetched:", JSON.stringify(teste));
    return teste;
  }
  @ResolveField(() => BasicMetrics, { name: 'basicMetrics' })
  async getBasicMetrics(): Promise<BasicMetrics> {
    return await this.dashboardService.getBasicMetrics();
  }
  @ResolveField(() => [TopWebsite], { name: 'topFiveWebsites' })
  async getTopFiveWebsites(): Promise<TopWebsite[]> {
    return this.dashboardService.getTop5Websites();
  }
}