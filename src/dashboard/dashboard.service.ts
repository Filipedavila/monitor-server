
import { Inject, Injectable } from '@nestjs/common';
import { DashboardMetrics } from './entities/dashboard-metrics.entity';
import { ClickHouseClient } from '@clickhouse/client';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BasicMetrics } from './entities/basic-counters.entity';

interface StatsCounters {
  nDirectories: number;
  nWebsites: number;
  nPages: number;
  nTags: number;
  nCategories: number;
  recentPage: Date;
  oldestPage: Date;
}
@Injectable()
export class DashboardService {
  

  constructor(@InjectEntityManager() private readonly entityManager: EntityManager,
  @Inject('CLICKHOUSE_CONNECTION')  private readonly clickHouseClient: ClickHouseClient) {}
  
  async getTop5Websites(): Promise<any[]> {
    const query = `
      SELECT
        DirectoryId,
        entity,
        name,
        AVG(score) AS avg_score
      FROM evaluations_tests
      GROUP BY DirectoryId, entity, name
      ORDER BY avg_score DESC
      LIMIT 5;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });

    const rows = await result.json<any>();
    return rows;
  }

  async getBasicMetrics(): Promise<BasicMetrics> {
    const result = await this.entityManager.query(`
      SELECT
      (SELECT COUNT(DISTINCT directoryID) FROM directories) AS nDirectories,
      (SELECT COUNT(DISTINCT websiteId) FROM websites) AS nWebsites,
      (SELECT COUNT(DISTINCT page_id) FROM pages) AS nPages,
      (SELECT COUNT(DISTINCT tag_id) FROM tags) AS nTags,
      (SELECT COUNT(DISTINCT category_id) FROM categories WHERE show_in_observatory = 1) AS nCategories,
      (SELECT COUNT(DISTINCT organization_id) FROM organizations) AS nEntities,
      (SELECT MAX(evaluationDate) FROM evaluations) AS recentPage,
      (SELECT MIN(evaluationDate) FROM evaluations) AS oldestPage;
    `);
    if (!result || result.length === 0) {
    throw new Error('Failed to retrieve metrics counters from the database.');
    }
    const rawData = result[0];
    return {
    nDirectories: Number.parseInt(rawData.ndirectories ?? rawData.nDirectories, 10),
    nWebsites: Number.parseInt(rawData.nwebsites ?? rawData.nWebsites, 10),
    nPages: Number.parseInt(rawData.npages ?? rawData.nPages, 10),
    nTags: Number.parseInt(rawData.ntags ?? rawData.nTags, 10),
    nCategories: Number.parseInt(rawData.ncategories ?? rawData.nCategories, 10),
    nEntities: Number.parseInt(rawData.nentities ?? rawData.nEntities, 10),
    recentPage: new Date(rawData.recentpage ?? rawData.recentPage), 
    oldestPage: new Date(rawData.oldestpage ?? rawData.oldestPage),
    }
  };
 
  async getMetrics(): Promise<DashboardMetrics> {
    return {
      score: 7.3016689352915085,
      basicMetrics: {
      nDirectories: 34,
      nWebsites: 2122,
      nEntities: 1198,
      nPages: 123392,
      nTags: 37,
      nCategories: 37,
      recentPage: new Date("2026-04-17T09:05:06.000Z"),
      oldestPage: new Date("2020-12-15T01:00:52.000Z"),
      },
      //nPagesWithoutErrors: 18138,
      topFiveWebsites: [
        {
          index: 1,
          id: 4,
          DirectoryId: 1,
          entity: "Secretaria-Geral do Ministério da Defesa Nacional",
          name: "Portal da Defesa Nacional",
          score: 10
        },
         {
          index: 2,
          id: 5,
          DirectoryId: 2,
          entity: "Secretaria-Geral do Ministério da Defesa Nacional",
          name: "Portal da Defesa Nacional",
          score: 10
        }
      ]
    };
  }
}
