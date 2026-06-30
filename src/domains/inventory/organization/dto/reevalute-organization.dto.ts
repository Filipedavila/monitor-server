import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class ReevaluateOrganizationDto {
  @IsNotEmpty({message: "organizationsId is required"})
  @IsArray({message: "organizationsId must be an array of numbers"})
  @IsNumber({}, { each: true, message: "each organization ID must be a number" })
  @Min(1, { each: true, message: "each organization ID must be greater than 0" })
  organizationsId: number[];
  @IsNotEmpty({message: "option is required"})
  @IsString({message: "option must be a string"}) 
  option: string;
}
