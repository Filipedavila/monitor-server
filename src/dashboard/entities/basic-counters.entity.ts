import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import {TopWebsite} from './top-website.entity';

@ObjectType()
export class BasicMetrics {

  @Field(() => Int)
  nDirectories: number;

  @Field(() => Int)
  nWebsites: number;

  @Field(() => Int)
  nEntities: number;

  @Field(() => Int)
  nPages: number;

  @Field(() => Int)
  nTags: number;

  @Field(() => Int)
  nCategories: number;

  @Field(() => Date) 
  recentPage: Date;

  @Field(() => Date)
  oldestPage: Date;

}