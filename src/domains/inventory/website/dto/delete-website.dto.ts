import {  IsNumber, Min } from "class-validator";

export class DeleteWebsiteDto {
  @IsNumber({}, { message: "websiteId must be a number" })
  @Min(1, { message: "websiteId must be greater than 0" })
  websiteId: number;
}
