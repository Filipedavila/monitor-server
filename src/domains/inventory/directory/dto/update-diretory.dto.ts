import { IsArray,  IsBoolean,  IsEnum,  IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { TagMatchingStrategyType } from "../directory.entity";

export class UpdateDirectory {
  @IsOptional()
  @IsNumber({}, { message: "directoryId must be a number" })
  directoryId: number;

  @IsOptional()
  @IsEnum(['UNION', 'INTERSECTION'], { message: "strategy must be either 'UNION' or 'INTERSECTION'" })
  strategy: TagMatchingStrategyType;

  @IsOptional()
  @IsBoolean({ message: "observatory must be a boolean" })
  showInObservatory: boolean;

  @IsString({ message: "name must be a string" })
  @IsOptional()
  name: string;



}
