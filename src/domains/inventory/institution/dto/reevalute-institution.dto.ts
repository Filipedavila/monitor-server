import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class ReevaluateInstitutionDto {
  @IsNotEmpty({message: "institutionIds is required"})
  @IsArray({message: "institutionIds must be an array of numbers"})
  @IsNumber({}, { each: true, message: "each institution ID must be a number" })
  @Min(1, { each: true, message: "each institution ID must be greater than 0" })
  institutionIds: number[];
  @IsNotEmpty({message: "option is required"})
  @IsString({message: "option must be a string"}) 
  option: string;
}
