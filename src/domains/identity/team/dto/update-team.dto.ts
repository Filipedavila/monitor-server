import { ArrayMaxSize, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class UpdateTeamDTO {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(250)
  teamName: string;
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "Website IDs must be numbers.", each: true })
  @ArrayMaxSize(500, { message: "Cannot add more than 500 websites at each request." })
  @Min(1, { message: "Website IDs must be positive integers.", each: true })
  websiteIds: number[];
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "User IDs must be numbers.", each: true })
  @ArrayMaxSize(500, { message: "Cannot add more than 500 users at each request." })
  @Min(1, { message: "User IDs must be positive integers.", each: true })
  userIds: number[];
}
