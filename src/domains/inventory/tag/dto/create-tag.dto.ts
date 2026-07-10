import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTagDTO {

  @IsNotEmpty({ message: "name is required" })
  @IsString({ message: "name must be a string" })
  name: string;

}
