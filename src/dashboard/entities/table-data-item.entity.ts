import { ObjectType, Field, Int } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';


@ObjectType({ description: 'Granular rule evaluation data structured for tabular visualization' })
export class TableDataItem {
  @Field(() => String, { description: 'The WCAG rule or technique identifier (e.g., label_03)' })
  key: string;

  @Field(() => WcagLevel, { description: 'The WCAG strict compliance level' })
  level: WcagLevel;

  @Field(() => String, { description: 'Target element scope (e.g., all)' })
  elem: string;

  @Field(() => Int, { description: 'Total number of unique websites with this error' })
  websites: number;

  @Field(() => Int, { description: 'Total number of pages affected' })
  pages: number;

  @Field(() => Int, { description: 'Total occurrences of the specific element violation' })
  elems: number;

  @Field(() => [QuartileMetrics], { description: 'Array of exactly 4 items mapping the score quartiles' })
  quartiles: QuartileMetrics[];

  @Field(() => String, { description: 'Categorization group of the affected element (e.g., other, image, form)' })
  elemGroup: string;
}


@ObjectType({ description: 'Lower and upper bounds for a statistical interval' })
export class QuartileInterval {
  @Field(() => Int, { description: 'The lower bound value' })
  lower: number;

  @Field(() => Int, { description: 'The upper bound value' })
  upper: number;
}

@ObjectType({ description: 'Statistical distribution data for a specific quartile' })
export class QuartileMetrics {
  @Field(() => Int, { name: 'total', description: 'Total item count in this quartile' })
  tot: number;

  @Field(() => Int, { name: 'percentage', description: 'Percentage representation of this quartile' })
  por: number;

  @Field(() => QuartileInterval, { name: 'interval', description: 'The value range inside this quartile' })
  int: QuartileInterval;
}

export enum WcagLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA',
}

registerEnumType(WcagLevel, {
  name: 'WcagLevel',
  description: 'Conformity levels defined by the WCAG guidelines',
});