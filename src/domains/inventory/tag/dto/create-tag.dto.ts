import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTagDTO {

  @IsNotEmpty({ message: "name is required" })
  @IsString({ message: "name must be a string" })
  name: string;

  @IsOptional()
  @IsArray({ message: "directories must be an array of numbers" })
  @IsNumber({}, { each: true, message: "each directory must be a number" })
  directories?: number[];

  @IsOptional()
  @IsArray({ message: "websites must be an array of numbers" })
  @IsNumber({}, { each: true, message: "each website must be a number" })
  websites?: number[];

}
