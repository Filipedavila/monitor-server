import {  IsNumber, IsOptional, IsString, Min } from "class-validator";
export class UpdateWebsiteDto {

  @IsOptional()
  @IsString({ message: "title must be a string" })
  title: string;

  @IsOptional()
  @IsNumber({}, { message: "organizationId must be a number" })
  @Min(1, { message: "organizationId must be greater than 0" })
  organizationId: number;

}
