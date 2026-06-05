import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TopBestPractices {
  @Field(() => String)
  ruleCode: string;

  @Field(() => Int)
  nOccurrences: number;

  @Field(() => Int)
  nPages: string;

  @Field(() => Int)
  nWebsites: number;


}