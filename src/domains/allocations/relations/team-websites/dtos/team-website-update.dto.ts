import { IsNumber, IsArray, IsOptional } from "class-validator";

export class UpdateTeamWebsitesDto {
  @IsOptional()
  @IsArray({ message: "The 'add' field must be an array" })
  @IsNumber({}, { each: true, message: "Each ID in 'add' must be a number" })
  add?: number[];

  @IsOptional()
  @IsArray({ message: "The 'remove' field must be an array" })
  @IsNumber({}, { each: true, message: "Each ID in 'remove' must be a number" })
  remove?: number[];
}