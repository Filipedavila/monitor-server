import { Injectable } from '@nestjs/common';
import { AnalyticRepository } from './analytics.repository';
import {
  GlobalStatistics,
  DirectoriesStats,
  WebsiteAuditReport,
  WebsiteRankingDetailed,
} from './types';
import {
  GlobalMetricsResponse,
  PlatformOverviewMetricsResponse,
} from './types/admin-dashboard.types';
import { ExportFormat, ExportContext } from './dto/export-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticRepository: AnalyticRepository) {}

  async getAdminOverview(): Promise<PlatformOverviewMetricsResponse> {
    return {
      ams: {
        directories: 40,
        tags: 63,
        entities: 993,
        websites: 2200,
        pages: 126485,
        users: 11,
        govUsers: 10,
        evaluations: {
          evalCount: 3721931,
          dateCountStart: '2023-01-01',
          processing: 0,
          waiting: 0,
          failed: 0,
        },
      },
      observatory: {
        directories: 39,
        tags: '38',
        entities: 1175,
        websites: 2051,
        pages: 122279,
      },
      mymonitor: {
        users: 11,
        teams: 11,
        websites: '33',
        pages: '',
        evaluations: {
          evalCount: 3721931,
          dateCountStart: '2023-01-01',
          processing: 0,
          waiting: 0,
          failed: 0,
        },
      },
      accessmonitor: {
        evalCount: 3721931,
        dateCountStart: '2023-01-01',
      },
    };
  }

  async getGlobalMetrics(): Promise<GlobalMetricsResponse> {
    // return await this.analyticRepository.getGlobalMetrics();
    return {
      ams: {
        score: 9,
        recentPageDate: '2023-01-01',
        oldestPageDate: '2026-01-01',
        directoriesCount: 34,
        institutionsCount: 1000,
        websitesCount: 2000,
        pagesCount: 300000,
        avgPagesPerWebsite: 5,
        websitesConformance: {
          conformWebsitesCount: 2,
          nonConformWebsitesCount: 7,
          A: 2,
          AA: 5,
          AAA: 2,
        },
        scoreDistribution: [23, 25, 30, 5, 1, 5, 6, 0, 0, 0],
        accessibilityPlotData: [23, 25, 30, 5, 1, 5, 6, 0, 0, 0],
        errorsDistribution: [
          {
            key: 'color_02',
            pagesCount: 4,
            occurrenceCount: 47,
          },
          {
            key: 'a_05',
            pagesCount: 1,
            occurrenceCount: 20,
          },
          {
            key: 'img_01b',
            pagesCount: 2,
            occurrenceCount: 2,
          },
          {
            key: 'form_01b',
            pagesCount: 1,
            occurrenceCount: 1,
          },
        ],
        bestPracticesDistribution: [
          {
            key: 'heading_01',
            pagesCount: 22,
            occurrenceCount: 43,
          },
          {
            key: 'title_06',
            pagesCount: 22,
            occurrenceCount: 22,
          },
        ],
      },
      observatory: {
        score: 7.4,
        recentPageDate: '2023-01-01',
        oldestPageDate: '2026-01-01',
        directoriesCount: 32,
        institutionsCount: 999,
        websitesCount: 2011,
        pagesCount: 200000,
        avgPagesPerWebsite: 7,
        websitesConformance: {
          conformWebsitesCount: 32,
          nonConformWebsitesCount: 4,
          A: 44,
          AA: 1,
          AAA: 22,
        },
        scoreDistribution: [23, 3, 30, 5, 1, 22, 6, 0, 0, 11],
        accessibilityPlotData: [23, 1, 30, 33, 1, 5, 6, 0, 0, 11],
        errorsDistribution: [
          {
            key: 'color_02',
            pagesCount: 10,
            occurrenceCount: 200,
          },
          {
            key: 'a_05',
            pagesCount: 11,
            occurrenceCount: 11,
          },
          {
            key: 'img_01b',
            pagesCount: 22,
            occurrenceCount: 22,
          },
          {
            key: 'form_01b',
            pagesCount: 10,
            occurrenceCount: 10,
          },
        ],
        bestPracticesDistribution: [
          {
            key: 'heading_01',
            pagesCount: 10,
            occurrenceCount: 10,
          },
          {
            key: 'title_06',
            pagesCount: 10,
            occurrenceCount: 10,
          },
        ],
      },
    };
  }

  async exportAnalytics(context: ExportContext, format: ExportFormat) {
    return await this.analyticRepository.exportAnalyticsStream(format);
  }

  async getGlobalStatistics(): Promise<GlobalStatistics> {
    return await this.analyticRepository.getGlobalSummary();
  }

  async getGlobalDirectoriesStatistics(): Promise<DirectoriesStats> {
    return await this.analyticRepository.getGlobalDirectoriesSummary();
  }

  async getWebsiteDetails(websiteId: number): Promise<WebsiteAuditReport> {
    const [summary, scoreDistribution, rulesMetrics, latestQuartiles] = await Promise.all([
      this.analyticRepository.getWebsiteSummary(websiteId),
      this.analyticRepository.getWebsiteScoreDistribution(websiteId),
      this.analyticRepository.getWebsiteRuleMetrics(websiteId),
      this.analyticRepository.getWebsiteRulesLatestQuartiles(websiteId),
    ]);
    return {
      ...summary,
      ...scoreDistribution,
      ...rulesMetrics,
      ...latestQuartiles,
    };
  }

  async getDirectoryStatistics(directoryId: number): Promise<DirectoriesStats> {
    return await this.analyticRepository.getDirectorySummary(directoryId);
  }

  async getDirectoryWebsites(directoryId: number): Promise<WebsiteRankingDetailed[]> {
    return await this.analyticRepository.getRankingDirectory(directoryId);
  }

  public async getWebsiteScoreDistribution(websiteId: number) {
    return await this.analyticRepository.getWebsiteScoreDistribution(websiteId);
  }

  public async searchWebsites(query: string): Promise<any[]> {
    return await this.analyticRepository.searchForWebsites(query);
  }
}
