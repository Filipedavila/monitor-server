import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class BadgeMetrics {
  @Field(() => Int, { description: 'Number of gold badges awarded' })
  gold: number;

  @Field(() => Int, { description: 'Number of silver badges awarded' })
  silver: number;

  @Field(() => Int, { description: 'Number of bronze badges awarded' })
  bronze: number;
}

@ObjectType()
export class PlatformBadges {
  @Field(() => BadgeMetrics, { description: 'Badges metrics for websites' })
  websites: BadgeMetrics;

  @Field(() => BadgeMetrics, { description: 'Badges metrics for applications' })
  apps: BadgeMetrics;
}

@ObjectType()
export class DashboardBadges {
  @Field(() => PlatformBadges, { description: 'Historical total badges cumulative data' })
  total: PlatformBadges;

  @Field(() => PlatformBadges, { description: 'Badges data filtered by the current calendar year' })
  currentYear: PlatformBadges;
}