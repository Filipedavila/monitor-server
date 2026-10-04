import { IsDate, IsEnum, IsNumber, IsString, Min } from "class-validator";
import { State } from "../state";

export class CreateAccessibilityStatementDto {
  @IsNumber({ allowNaN:false,allowInfinity: false }, {
    message: "Website ID must be a number"
  })
  @Min(1 ,{
    message: "Website ID must be a positive integer"
  })
  websiteId: number;
  @IsString( {
    message: "Conformance must be a string"
  })
  conformance: string;
  @IsString( {
    message: "Evidence must be a string"
  })
  evidence: string;
  @IsString( {
    message: "Seal must be a string"
  })
  seal: string ;
  @IsDate( {
    message: "Statement date must be a valid date"
  })
  statementDate: Date;
  @IsEnum(State, {
    message: "State must be a valid enum value (completeStatement, incompleteStatement, possibleStatement)"
  })
  state: State;
}
