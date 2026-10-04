import { PartialType } from "@nestjs/mapped-types";
import { CreateTagDTO } from "./create-tag.dto";
import { IsArray, IsNotEmpty, IsOptional, IsNumber, Min } from "class-validator";

export class UpdateTagDTO extends PartialType(CreateTagDTO) {
  @IsNumber({}, { message: "tagId must be a number" })
  @IsNotEmpty({ message: "tagId is required" })
  @Min(1, { message: "tagId must be a positive number" })
  tagId: number;


}
