import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType({ description: 'Detailed metrics for a specific WCAG test error' })
export class ErrorStats {
  @Field(() => String, { description: 'The WCAG test identifier code (e.g., color_02)' })
  code: string;

  @Field(() => Int, { 
    description: 'Total occurrences of this error.'
  })
  n_occurrences: number;

  @Field(() => Int, { description: 'Number of pages where this error occurs' })
  n_pages: number;

  @Field(() => Int, { description: 'Number of websites affected by this error' })
  n_websites: number;

  @Field(() => Int, { description: 'Number of unique tags associated' })
  n_tags: number;
}