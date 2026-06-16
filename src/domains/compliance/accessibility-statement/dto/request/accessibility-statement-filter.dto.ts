import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { AccessibilityStatement } from "../../entities/accessibility-statement.entity";
import { State } from "../../state";
export class AccessibilityStatementFilterDTO extends BaseFilterDTO<AccessibilityStatement> implements Required<Pick<AccessibilityStatement, "id" | "websiteId" | "conformance" | "evidence" | "seal" | "statementDate" | "state" |"createdAt" | "lastConsultedAt" >> {
 
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  id: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  websiteId: number;

  @IsOptional()
  @IsString()
  conformance: string;

  @IsOptional()
  @IsString()
  evidence: string;

  @IsOptional()
  @IsString()
  seal: string;

  @IsOptional()
  @IsDateString()
  statementDate: Date;

  @IsOptional()
  @IsEnum(State)
  state: State;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsDateString()
  lastConsultedAt: Date;

  @IsOptional()
  @IsDateString()
  createdAt: Date;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  year: number;
}
