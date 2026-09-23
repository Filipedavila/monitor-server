import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class EvaluationWorkerCommunicationDTO {
  @IsNumber()
  evaluationId: number;

  @IsString()
  url: string;

  @IsString()
  @IsEnum(["created", "completed", "failed"])
  status: "created" | "completed" | "failed";

  @IsOptional()
  @IsObject()
  summary?: {
    score: number;
    title: string;
    conform: string;
    date: Date;
  };

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
