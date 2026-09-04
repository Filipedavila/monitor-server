import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from 'src/domains/analytics/analytics.service';

@Injectable()
export class ObservatoryService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly logger: Logger,
  ) {}

  async getGlobalMetrics(): Promise<any> {
    return await this.analyticsService.getGlobalStatistics();
  }

  async getDirectoryWebsites(directoryId: number): Promise<any> {
    return await this.analyticsService.getDirectoryWebsites(directoryId);
  }

  async getDirectoriesStatistics() {
    return await this.analyticsService.getGlobalDirectoriesStatistics();
  }
  async getDirectoryStatistics(id: number) {
    return await this.analyticsService.getDirectoryStatistics(id);
  }

  async getWebsiteMetrics(websiteId: number) {
    return await this.analyticsService.getWebsiteDetails(websiteId);
  }

  async searchWebsites(query: string): Promise<any> {
    return await this.analyticsService.searchWebsites(query);
  }
}
