import { IsNumber, IsArray, IsOptional, Min } from "class-validator";

export class UpdateDirectoryTagsDto {
  
  @IsOptional()
  @IsArray({ message: "The 'add' field must be an array" })
  @Min(1, { each: true, message: "Each tag ID must be a positive number" })
  @IsNumber({}, { each: true, message: "Each tag ID must be a number" })
  add?: number[];

  @IsOptional()
  @IsArray({ message: "The 'remove' field must be an array" })
  @Min(1, { each: true, message: "Each tag ID must be a positive number" })
  @IsNumber({}, { each: true, message: "Each tag ID must be a number" })
  remove?: number[];
}