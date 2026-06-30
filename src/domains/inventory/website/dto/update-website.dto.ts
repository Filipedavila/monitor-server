import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
export class UpdateWebsiteDto {
  @IsNotEmpty({ message: "websiteId is required" })
  @IsNumber({}, { message: "websiteId must be a number" })
  @Min(1, { message: "websiteId must be greater than 0" })
  websiteId: number;

  @IsOptional()
  @IsString({ message: "title must be a string" })
  title: string;

  @IsOptional()
  @IsString({ message: "baseUrl must be a string" })
  baseUrl: string;

  @IsOptional()
  @IsNumber({}, { message: "organizationId must be a number" })
  @Min(1, { message: "organizationId must be greater than 0" })
  organizationId: number;

}
