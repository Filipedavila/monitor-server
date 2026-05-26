import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateTeamDTO {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(250)
  teamName: string;
  @IsOptional()
  @IsString({ each: true })
  websiteIds: string[];
  @IsOptional()
  @IsString({ each: true })
  userIds: string[];

}
