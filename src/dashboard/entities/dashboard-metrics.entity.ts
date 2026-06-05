import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import {TopWebsite} from './top-website.entity';
import { BasicMetrics } from './basic-counters.entity';
import { DashboardDeclarations } from './declarations.entity';
import { GraphDataItem } from './graph-data.entity';

@ObjectType()
export class DashboardMetrics {
  @Field(() => Float)
  score: number;
  @Field(() => BasicMetrics)
  basicMetrics: BasicMetrics;

  @Field(() => [TopWebsite]) 
  topFiveWebsites: TopWebsite[];
  /*
  @Field(()=> DashboardDeclarations)
  declarations: DashboardDeclarations;

  @Field(() => [GraphDataItem], { 
    name: 'graphData',
    description: 'Pre-computed time-series or category data optimized for client-side charts' 
  })
  graphData: GraphDataItem[];

  @Field(() => [Int], { 
    name: 'scoreDistributionFrequency',
    description: 'Histogram data representing the frequency frequency distribution of scores. Each index represents a specific score bucket bucket.' 
  })
  scoreDistributionFrequency: number[];
  */
}