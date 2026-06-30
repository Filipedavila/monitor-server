import { IsArray,  IsBoolean,  IsEnum,  IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { TagMatchingStrategyType } from "../directory.entity";

export class UpdateDirectory {
  @IsOptional()
  @IsNumber({}, { message: "directoryId must be a number" })
  directoryId: number;

  @IsOptional()
  @IsEnum(['MATCH_ALL', 'MATCH_ANY'], { message: "strategy must be either 'MATCH_ALL' or 'MATCH_ANY'" })
  strategy: TagMatchingStrategyType;

  @IsOptional()
  @IsBoolean({ message: "observatory must be a boolean" })
  showInObservatory: boolean;

  @IsString({ message: "name must be a string" })
  @IsOptional()
  name: string;

  @IsOptional()
  @IsArray({ message: "defaultTags must be an array of numbers" })
  @IsInt({ each: true, message: "defaultTags must be an array of integers" })
  @Min(1, { each: true, message: "defaultTags must contain positive integers" })
  tags: number[];


}
