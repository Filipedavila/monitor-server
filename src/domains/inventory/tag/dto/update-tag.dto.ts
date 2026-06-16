import { PartialType } from "@nestjs/mapped-types";
import { CreateTagDto } from "./create-tag.dto";
import { IsArray, IsNotEmpty, IsOptional, IsNumber, Min } from "class-validator";

export class UpdateTagDto extends PartialType(CreateTagDto) {
  @IsNumber({}, { message: "tagId must be a number" })
  @IsNotEmpty({ message: "tagId is required" })
  @Min(1, { message: "tagId must be a positive number" })
  tagId: number;

  @IsOptional()
  @IsArray({ message: "directories must be an array of numbers" })
  @IsNumber({}, { each: true, message: "each directory must be a number" })
  directories?: number[];

  @IsOptional()
  @IsArray({ message: "websites must be an array of numbers" })
  @IsNumber({}, { each: true, message: "each website must be a number" })
  websites?: number[];
}
