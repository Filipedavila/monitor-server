import { ArrayMaxSize, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateTeamDTO {
  @IsNotEmpty()
  @IsString({ message: "Team name must be a string." })
  @MinLength(3, { message: "Team name must be at least 3 characters long." })
  @MaxLength(250, { message: "Team name cannot exceed 250 characters." })
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
