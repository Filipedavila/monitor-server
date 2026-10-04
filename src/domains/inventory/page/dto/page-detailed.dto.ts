import { Expose, Type } from "class-transformer";
export class PageEvalDTO {
  @Expose()
  id: number;

  @Expose()
  url: string;

  @Expose()
  websiteId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => PageEvaluationResponseDto)
  evaluation?: PageEvaluationResponseDto;
}

export class PageEvaluationResponseDto {
  @Expose()
  id: number;

  @Expose()
  score: string;

  @Expose()
  createdAt: Date;
}