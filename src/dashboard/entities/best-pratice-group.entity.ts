import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType({ description: 'Metrics for a specific accessibility best practice rule evaluation' })
export class BestPracticeItem {
  @Field(() => String, { description: 'The identifier key of the best practice (e.g., title_06, button_01)' })
  code: string;

  @Field(() => Int, { name: 'occurrences', description: 'Total number of times this practice was successfully verified' })
  n_occurrences: number;

  @Field(() => Int, { name: 'pages', description: 'Number of pages compliant with this best practice' })
  n_pages: number;

  @Field(() => Int, { name: 'websites', description: 'Number of websites compliant with this best practice' })
  n_websites: number;

  @Field(() => Int, { name: 'tags', description: 'Number of unique tags associated with this evaluation context' })
  n_tags: number;
}
@ObjectType({ description: 'Best practices evaluation metrics grouped by execution status' })
export class BestPracticesGroup {
  @Field(() => String, { description: 'The evaluation outcome group status (e.g., success, warning, failed)' })
  status: string;

  @Field(() => [BestPracticeItem], { description: 'List of individual best practice metrics belonging to this status' })
  rules: BestPracticeItem[];
}
