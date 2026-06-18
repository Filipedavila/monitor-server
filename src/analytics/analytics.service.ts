import {  Injectable } from '@nestjs/common';
import { AnalyticsOLAPRepository } from './analytics-olap.repository';
import { AnalyticsOLTPRepository } from './analytics-oltp.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsOLAPRepository: AnalyticsOLAPRepository,
              private readonly analyticsOLTPRepository: AnalyticsOLTPRepository
  ) {}

async getAvgScoreWebsite(websiteId:number){
    return await this.analyticsOLAPRepository.getAvgScoreWebsite(websiteId);
  }
  async getAvgScore():Promise<any>{
        return await this.analyticsOLAPRepository.getAvgScore();
  }
      
  async getTop5Websites(): Promise<any[]> {
    return await this.analyticsOLAPRepository.getTop5Websites();
  }
   

  async getTopBestPractices(): Promise<any[]> {
    return await this.analyticsOLAPRepository.getTopBestPractices();
  }
    
  async getTopBadPractices(): Promise<any[]> {
    return await this.analyticsOLAPRepository.getTopBadPractices();
  }
  
  
  async getWebsiteTopBestPractices(websiteId:number): Promise<any[]> {
   return await this.analyticsOLAPRepository.getWebsiteTopBestPractices(websiteId);
  }

  async getWebsiteTopBadPractices(websiteId:number): Promise<any[]> {
    return await this.analyticsOLAPRepository.getWebsiteTopBadPractices(websiteId);
  
  }



  public async getWebsiteScoreDistribution(websiteId:number){
    return await this.analyticsOLAPRepository.getWebsiteScoreDistribution(websiteId);
  }

  
}
