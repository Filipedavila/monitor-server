
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class ConformityMetrics {
  @Field(() => Int, { description: 'Number of conforming items' })
  conform: number;

  @Field(() => Int, { description: 'Number of partially conforming items' })
  partial: number;

  @Field(() => Int, { name: 'notConform', description: 'Number of non-conforming items' })
  not_conform: number; 
}

@ObjectType()
export class PlatformMetrics {
  @Field(() => ConformityMetrics)
  websites: ConformityMetrics;

  @Field(() => ConformityMetrics)
  apps: ConformityMetrics;
}

@ObjectType()
export class DashboardDeclarations {
  @Field(() => PlatformMetrics, { description: 'Historical total metrics' })
  total: PlatformMetrics;

  @Field(() => PlatformMetrics, { description: 'Metrics filtered by the current calendar year' })
  currentYear: PlatformMetrics;
}