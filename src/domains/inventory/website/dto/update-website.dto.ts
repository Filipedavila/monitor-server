import {  IsNumber, IsOptional, IsString, Min } from "class-validator";
export class UpdateWebsiteDto {

  @IsOptional()
  @IsString({ message: "title must be a string" })
  title: string;

  @IsOptional()
  @IsNumber({}, { message: "institutionId must be a number" })
  @Min(1, { message: "institutionId must be greater than 0" })
  institutionId: number;

}
