import { IsNotEmpty, IsNumber, IsOptional, Min,IsString, IsArray } from "class-validator";

export class UpdateOrganizationDTO {
  @IsNotEmpty({ message: "organizationId must be provided" })
  @IsNumber({ allowInfinity: false , allowNaN: false }, { message: "organizationId must be a number" })
  @Min(1, { message: "organizationId must be a positive integer" })
  organizationId: number;
  @IsOptional()
  @IsString({ message: "shortName must be a string" })
  shortName: string;
  @IsOptional()
  @IsString({ message: "longName must be a string" })
  longName: string;
  @IsOptional()
  @IsArray({ message: "websiteIds must be an array of numbers" })
  @IsNumber({}, { each: true, message: "Each websiteId must be a number" })
  @Min(1, { each: true, message: "Each websiteId must be a positive integer" })
  websiteIds: number[];
}