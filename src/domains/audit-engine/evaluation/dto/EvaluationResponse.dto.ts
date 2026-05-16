import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Evaluation } from "../entities/evaluation.entity";
import { EvaluationResult } from "../entities/evaluation-result.entity";

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
  EvaluationResult?: any;

  @IsOptional()
  @IsString()
  errorReason?: string;
}
