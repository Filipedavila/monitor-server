import { Inject, Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client'; 
import { CLICKHOUSE_CLIENT } from 'src/core/clickhouse/clickhouse.constants';

const CLICKHOUSE_TABLES = {
  EVALUATIONS : 'evaluations',
  DIRECTORY_SNAPSHOTS : ''

}
@Injectable()
export class AnalyticsOLAPRepository {
  constructor(
    @Inject(CLICKHOUSE_CLIENT)  private readonly clickHouseClient: ClickHouseClient,
  ) {}


async getAvgScoreGlobalWebsite(websiteId:number){
    const query = `
        SELECT AVG(score) AS avg_score
        FROM evaluations WHERE websiteId = {website_id:UInt32}
        `;

        const result = await this.clickHouseClient.query({
          query,
          query_params:{
            website_id:websiteId

          },
          format: 'CSV',
        });
       const text = await result.text(); 
        return Number(text.trim());
  }


  async getAvgScore():Promise<any>{
        const query = `
        SELECT AVG(score) AS avg_score
        FROM evaluations_statistics
        `;

        const result = await this.clickHouseClient.query({
          query,
          format: 'CSV',
        });
       const text = await result.text(); 
        return Number(text.trim());
      }

      
  async getTop5Websites(): Promise<any[]> {
    const query = `
    SELECT
        websiteId,
        dictGet('default.websites_dict', 'title', websiteId) AS title,
        AVG(score) AS avg_score
    FROM evaluations_statistics
    GROUP BY websiteId
    ORDER BY avg_score DESC
    LIMIT 5
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

  async getTopBestPractices(): Promise<any[]> {
    const query = `
    SELECT
    rule_code,
    dictGet('default.rules_dict', 'rule_title', rule_code) AS rule_description,
    sum(passed) AS total
    FROM evaluations_statistics
    WHERE dictGet('default.rules_dict', 'expected_result', rule_code) = 'passed'
    GROUP BY rule_code
    ORDER BY total DESC
    LIMIT 5;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

  async getTopBadPractices(): Promise<any[]> {
    const query = `
    SELECT
    rule_code,
    dictGet('default.rules_dict', 'rule_title', rule_code) AS rule_description,

    sum(failed) AS total
    FROM evaluations_statistics
    WHERE dictGet('default.rules_dict', 'expected_result', rule_code) = 'failed'
    GROUP BY rule_code
    ORDER BY total DESC
    LIMIT 5;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  
  }

  
  async getWebsiteTopBestPractices(websiteId:number): Promise<any[]> {
    const query = `
    SELECT
    rule_code,
    dictGet('default.rules_dict', 'wcag_level', rule_code) AS level,
    dictGet('default.rules_dict', 'rule_title', rule_code) AS rule_description,
    sum(passed) AS total
    FROM evaluations_statistics
    WHERE dictGet('default.rules_dict', 'expected_result', rule_code) = 'passed' AND websiteId = {website_id:UInt32}
    GROUP BY rule_code
    ORDER BY total DESC
    LIMIT 10;
    `;

    const result = await this.clickHouseClient.query({
      query,
      query_params:{
        website_id:websiteId
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

  async getWebsiteTopBadPractices(websiteId:number): Promise<any[]> {
    /*const query = `
    SELECT
    rule_code,
    dictGet('default.rules_dict', 'wcag_level', rule_code) AS level,
    dictGet('default.rules_dict', 'rule_title', rule_code) AS rule_description,
    uniqExactIf(page_id, passed = 0) AS pages_affected,
    sum(passed) AS total
    FROM evaluations_statistics
    WHERE dictGet('default.rules_dict', 'expected_result', rule_code)  = 'failed' AND websiteId = {website_id:UInt32}
    GROUP BY rule_code
    ORDER BY total DESC
    LIMIT 10;
    `;*/
    /*
    const query = `
    SELECT
        rule_code,
        dictGet('default.rules_dict', 'wcag_level', rule_code) AS level,
        dictGet('default.rules_dict', 'rule_title', rule_code) AS rule_description,
        count() AS pages_affected,             
        sum(total_page_failed) AS total  
    FROM (
        SELECT 
            page_id,
            rule_code,
            sum(failed) AS total_page_failed
        FROM evaluations_statistics
        WHERE websiteId = {website_id:UInt32}
        GROUP BY page_id, rule_code
    )

    WHERE dictGet('default.rules_dict', 'expected_result', rule_code) = 'failed'
    GROUP BY rule_code
    ORDER BY pages_affected DESC
    LIMIT 10;
    `;
*/
const query = `
    SELECT
        rule_code,
        dictGet('rules_dict', 'wcag_level', rule_code) AS level,
        dictGet('rules_dict', 'rule_title', rule_code) AS rule_description,
        count(DISTINCT page_id) AS pages_affected,
        sum(count) AS total_violations
    FROM evaluations
    ARRAY JOIN rules_counts AS (rule_code, count)
    WHERE websiteId = {website_id: UInt32}
      AND dictGet('rules_dict', 'expected_result', rule_code) = 'failed'
    GROUP BY rule_code
    ORDER BY pages_affected DESC
    LIMIT 10;
  `;
    const result = await this.clickHouseClient.query({
      query,
      query_params:{
        website_id:websiteId
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  
  }

  async getWebsiteTopBadPracticesFromSnapshot(websiteId: number, period: number): Promise<any[]> {
  // Nota: 'period' seria o 'evaluationPeriod' (ex: 202601)
  const query = `
    SELECT
        rule_code,
        dictGet('rules_dict', 'wcag_level', rule_code) AS level,
        dictGet('rules_dict', 'rule_title', rule_code) AS rule_description,
        -- Aqui usamos 'Merge' para consolidar o estado armazenado
        sumMapMerge(rules_agg).1 AS rule_codes, 
        sumMapMerge(rules_agg).2 AS counts
    FROM agg_metrics_website
    ARRAY JOIN 
        sumMapMerge(rules_agg) AS (rule_code, count)
    WHERE websiteId = {website_id: UInt32}
      AND evaluationPeriod = {period: UInt32}
      AND dictGet('rules_dict', 'expected_result', rule_code) = 'failed'
    GROUP BY rule_code
    ORDER BY count DESC
    LIMIT 10;
  `;

  return null as any;

  }


  public async getWebsiteScoreDistribution(websiteId:number){
    const query = `
        WITH 
        base_buckets AS (
            SELECT 
                intDiv(toUInt32(if(score >= 10, 9, score)), 1) AS bucket_id,
                count() AS f_absoluta
            FROM evaluations_statistics
            WHERE websiteId = {website_id:UInt32}
            GROUP BY bucket_id
        ),

        total_stats AS (
            SELECT count() AS total_geral FROM evaluations_statistics WHERE websiteId = {website_id:UInt32}
        )
    SELECT 
        if(bucket_id = 9, '[9-10]', concat('[', toString(bucket_id), '-', toString(bucket_id + 1), '[')) AS interval,
        f_absoluta,
        round((f_absoluta / (SELECT total_geral FROM total_stats)) * 100, 2) AS f_percentual,
        sum(f_absoluta) OVER (ORDER BY bucket_id ASC) AS f_acumulada,
        round((sum(f_absoluta) OVER (ORDER BY bucket_id ASC) / (SELECT total_geral FROM total_stats)) * 100, 2) AS f_percentual_acumulada
    FROM base_buckets
    ORDER BY bucket_id ASC;
    `;

    

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
      website_id:websiteId},
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

}
