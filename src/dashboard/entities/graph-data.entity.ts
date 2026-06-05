import { ObjectType, Field, Int } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';

export enum AccessibilityResultStatus {
  FAILED = 'failed',
  PASSED = 'passed',
  WARNING = 'warning',
}

registerEnumType(AccessibilityResultStatus, {
  name: 'AccessibilityResultStatus',
  description: 'The final execution status of the accessibility rule evaluation',
});

@ObjectType({ description: 'Granular metric item for accessibility graph rendering' })
export class GraphDataItem {
  @Field(() => String, { description: 'The WCAG rule or technique key (e.g., color_02)' })
  key: string;

  @Field(() => String, { description: 'The target element scope analyzed (e.g., all, body, image)' })
  elem: string;

  @Field(() => Int, { description: 'Total number of pages that triggered this specific result' })
  n_pages: number;

  @Field(() => Int, { description: 'Total number of unique websites affected' })
  n_websites: number;

  @Field(() => AccessibilityResultStatus, { 
    description: 'The strict evaluation outcome of the rule status' 
  })
  result: AccessibilityResultStatus;
}