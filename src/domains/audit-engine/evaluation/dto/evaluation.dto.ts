import { Expose, Transform, Type } from 'class-transformer';
import { PublishStatus } from '../entities/evaluation.entity';

export class EvaluationDTO {
  @Expose()
  id!: number;

  @Expose()
  pageId!: number;

  @Expose()
  pageTitle!: string | null;

  @Expose()
  @Transform(({ value }) => (value !== null && value !== undefined ? parseFloat(value) : null), {
    toClassOnly: true,
  })
  score!: number | null;

  @Expose()
  A!: number | null;

  @Expose()
  AA!: number | null;

  @Expose()
  AAA!: number | null;

  @Expose()
  tagCount!: number | null;

  @Expose()
  status!: PublishStatus;

  @Expose()
  evaluationDate!: Date | null;

  @Expose()
  frozenAt!: Date | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  createdById!: number | null;
}
