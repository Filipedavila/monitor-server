import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from 'src/core/clickhouse/clickhouse.constants';
import {
  DIRECTORY_WEBSITE_RANKING_QUERY,
  DIRECTORY_WEBSITE_STATISTICS_QUERY,
} from './queries/directory.queries';
import {
  WEBSITE_METRICS_QUERY,
  WEBSITE_PLOT_SCORE_QUERY,
  WEBSITE_RULES_LATEST_QUARTILES,
  WEBSITE_SCORE_DISTRIBUTION_QUERY,
  WEBSITE_SCORE_METRICS_QUERY,
  WEBSITE_SUMMARY_QUERY,
} from './queries/website.queries';
import { SEARCH_WEBSITES_QUERY } from './queries/search.queries';
import { Readable } from 'stream';
import { ExportFormat } from './dto/export-analytics.dto';

export interface FileStreamResult {
  stream: Readable;
  contentType: string;
  filename: string;
}

@Injectable()
export class AnalyticRepository {
  constructor(@Inject(CLICKHOUSE_CLIENT) private readonly clickHouseClient: ClickHouseClient) {}

  async getGlobalSummary(): Promise<any> {
    const query = `
      SELECT * FROM accessibility.v_global_summary
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getGlobalDirectoriesSummary(): Promise<any> {
    const query = `
      SELECT * FROM accessibility.v_directories_global_summary
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getDirectorySummary(directoryId: number): Promise<any> {
    const query = DIRECTORY_WEBSITE_STATISTICS_QUERY;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        directory_id: directoryId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getRankingDirectory(directoryId: number): Promise<any[]> {
    const query = DIRECTORY_WEBSITE_RANKING_QUERY;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        directory_id: directoryId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

  async getWebsiteSummary(websiteId: number): Promise<any> {
    const query = `
      ${WEBSITE_SUMMARY_QUERY}
    `;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        websiteId: websiteId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getWebsitePlotData(websiteId: number): Promise<any> {
    const query = WEBSITE_PLOT_SCORE_QUERY;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        websiteId: websiteId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getWebsiteScoreDistribution(websiteId: number): Promise<any> {
    const query = `
      ${WEBSITE_SCORE_METRICS_QUERY}
    `;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        websiteId: websiteId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getWebsiteRuleMetrics(websiteId: number): Promise<any> {
    const query = `
      ${WEBSITE_METRICS_QUERY}
    `;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        websiteId: websiteId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }
  async getWebsiteRulesLatestQuartiles(websiteId: number): Promise<any> {
    const query = `
      ${WEBSITE_RULES_LATEST_QUARTILES}
    `;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        websiteId: websiteId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async searchForWebsites(query: string): Promise<any[]> {
    const result = await this.clickHouseClient.query({
      query: `
        ${SEARCH_WEBSITES_QUERY}
      `,
      query_params: {
        token: query,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

  async exportAnalyticsStream(format: ExportFormat): Promise<FileStreamResult> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const { chFormat, contentType, extension } = this.resolveFormatMetadata(format);

    const query = `
      SELECT 
        *
      FROM evaluations
      LIMIT 1000
    `;

    const resultSet = await this.clickHouseClient.query({
      query,
      format: chFormat,
      clickhouse_settings: {
        max_execution_time: 60,
      },
    });

    const nodeStream = resultSet.stream();

    return {
      stream: nodeStream as unknown as Readable,
      contentType,
      filename: `analytics-export-${timestamp}.${extension}`,
    };
  }

  private resolveFormatMetadata(format: ExportFormat) {
    switch (format) {
      case ExportFormat.CSV:
        return {
          chFormat: 'CSVWithNames' as const,
          contentType: 'text/csv; charset=utf-8',
          extension: 'csv',
        };

      case ExportFormat.JSON:
        return {
          chFormat: 'JSONEachRow' as const,
          contentType: 'application/x-ndjson; charset=utf-8',
          extension: 'ndjson',
        };

      case ExportFormat.PARQUET:
        return {
          chFormat: 'Parquet' as const,
          contentType: 'application/vnd.apache.parquet',
          extension: 'parquet',
        };

      default:
        throw new BadRequestException(`Formato ${format} não suportado.`);
    }
  }
}
