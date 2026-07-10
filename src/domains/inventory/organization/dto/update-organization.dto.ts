import {  IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateOrganizationDto {

  @IsNotEmpty({message: "organizationId is required"})
  @IsNumber({}, {message: "organizationId must be a number"})
  @Min(1, {message: "organizationId must be greater than 0"})
  organizationId: number;
  @IsOptional()
  @IsString({message: "shortName must be a string"})
  shortName: string;
  @IsOptional()
  @IsString({message: "longName must be a string"})
  longName: string;

}
