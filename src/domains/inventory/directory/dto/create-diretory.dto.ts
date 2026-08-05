import { IsArray,  IsBoolean,  IsEnum,  IsInt,  IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { TagMatchingStrategyType } from "../directory.entity";

export class CreateDirectory {

  @IsNotEmpty({ message: "name is required" })
  @IsString({ message: "name must be a string" })
  name: string;

  @IsNotEmpty({ message: "strategy is required" })
  @IsEnum(['UNION', 'INTERSECTION'], { message: "strategy must be either 'UNION' or 'INTERSECTION'" })
  strategy: TagMatchingStrategyType;
 
  @IsNotEmpty({ message: "observatory is required" })
  @IsBoolean({ message: "observatory must be a boolean" })
  showInObservatory: boolean;
/*
  @IsOptional()
  @IsArray({ message: "defaultTags must be an array of numbers" })
  @IsInt({ each: true, message: "defaultTags must be an array of integers" })
  @Min(1, { each: true, message: "defaultTags must contain positive integers" })
  tags: number[];
  */
}
