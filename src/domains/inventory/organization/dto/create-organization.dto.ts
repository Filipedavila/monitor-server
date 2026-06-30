import {  IsNotEmpty, IsString } from "class-validator";

export class CreateOrganizationDto {
  @IsNotEmpty({message: "shortName is required"})
  @IsString({message: "shortName must be a string"})
  shortName: string;
  @IsString({message: "longName must be a string"})
  @IsNotEmpty({message: "longName is required"})
  longName: string;
}
