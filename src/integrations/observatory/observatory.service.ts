import {  Injectable, Logger} from "@nestjs/common";
import { AnalyticsService } from "src/analytics/analytics.service";


@Injectable()
export class ObservatoryService {

 constructor(private readonly analyticsService:AnalyticsService,
    private readonly logger:Logger) {}


  async getGlobalMetrics(): Promise<any> {
   return await this.analyticsService.getGlobalStatistics();

  const [avgScore,invetoryCounters,topWebsites,topGoodPratices,topBadPratices] =
  await Promise.all([
    this.analyticsService.getAvgScore().catch(err => {
      this.logger.error('Failed to fetch avgScore:', err);
      return null;
    }),
    
    this.getInventoryCounters().catch(err => {
      this.logger.error('Failed to fetch inventoryCounters:', err);
      return null; 
    }),
    
    this.analyticsService.getTop5Websites().catch(err => {
      this.logger.error('Failed to fetch topWebsites:', err);
      return []; 
    }),
    
    this.analyticsService.getTopBestPractices().catch(err => {
      this.logger.error('Failed to fetch topGoodPractices:', err);
      return [];
    }),
    
    this.analyticsService.getTopBadPractices().catch(err => {
      this.logger.error('Failed to fetch topBadPractices:', err);
      return []; 
    })
  ]);

    return {
      avgScore,
      invetoryCounters,
      topWebsites,
      topGoodPratices,
      topBadPratices
      };
  }
  async getDirectoryWebsites(directoryId: number): Promise<any> {
    return await this.analyticsService.getDirectoryWebsites(directoryId);
  }
  async getDirectoriesRanks(){
    return await this.analyticsService.getDirectoriesRank();
  }

  async getDirectoriesStatistics(){
    return await this.analyticsService.getDirectoriesStatistics();
  }
  async getDirectoryStatistics(id: number){
    return await this.analyticsService.getDirectoryStatistics(id);
  }
  async getDirectoryDetails(id: number){
    return await this.analyticsService.getDirectoriesDetails(id);
  } 
  async getWebsiteMetrics(websiteId:number){
    return await this.analyticsService.getWebsiteDetails(websiteId);
  
  const [websiteAvg,scoreDistribution,topGoodPratices,topBadPratices] =
  await Promise.all([
    this.analyticsService.getAvgScoreWebsite(websiteId),
    this.analyticsService.getWebsiteScoreDistribution(websiteId),
    this.analyticsService.getWebsiteTopBestPractices(websiteId),
    this.analyticsService.getWebsiteTopBadPractices(websiteId)


  ]);

  return {
    websiteAvg,
    scoreDistribution,
    topGoodPratices,
    topBadPratices
  }
  }
  

  async getInventoryCounters():Promise<any>{
    // stub TODO:
    return( 
    {
      nDirectories:34,
      nEntities:1198,
      nWebsites:2122,
      nPages:123392,
      nDeclarations:486,
      nConform:363,
      nParcialConform:88,
      nNonConform:35,
      nStamps:48,
      nGoldStamps:12,
      nSilverStamps:30,
      nBronzeStamps:6
    })
  }
  

}