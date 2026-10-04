import {  IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateInstitutionDto {

  @IsNotEmpty({message: "institutionId is required"})
  @IsNumber({}, {message: "institution Id must be a number"})
  @Min(1, {message: "institution Id must be greater than 0"})
  institutionId: number;
  @IsOptional()
  @IsString({message: "shortName must be a string"})
  shortName: string;
  @IsOptional()
  @IsString({message: "longName must be a string"})
  longName: string;

}
