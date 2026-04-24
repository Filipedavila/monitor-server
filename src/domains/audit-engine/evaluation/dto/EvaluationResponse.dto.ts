import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class EvaluationFinishedDTO {
  @IsNumber()
  evaluationId: number;

  @IsNumber()
  pageId: number;

  @IsString()
  @IsEnum(["success", "error", "warning"])
  status: "success" | "error" | "warning";

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  errorReason?: string;
}
