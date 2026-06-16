import { IsArray,  IsInt,  IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateDirectory {
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "id must be a number" })
  @IsNotEmpty({ message: "id is required" })
  @Min(1, { message: "id must be a positive number" })
  id: number;
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "strategy must be a number" })
  strategy: number;
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "observatory must be a number" })

  observatory: number;
  @IsString({ message: "name must be a string" })
  @IsOptional()
  name: string;
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "method must be a number" })
  @IsOptional()
  method: number;
  @IsOptional()
  @IsArray({ message: "defaultTags must be an array of numbers" })
  @IsInt({ each: true, message: "defaultTags must be an array of integers" })
  @Min(1, { each: true, message: "defaultTags must contain positive integers" })
  tags: number[];
  @IsOptional()
  @IsNumber({}, { message: "directoryId must be a number" })
  directoryId: number;
}
