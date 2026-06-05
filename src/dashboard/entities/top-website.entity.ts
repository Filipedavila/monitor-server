import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class TopWebsite {
  @Field(() => Int)
  index: number;

  @Field(() => ID)
  id: number;

  @Field(() => Int)
  DirectoryId: number;

  @Field(() => String)
  entity: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  score: number;
}