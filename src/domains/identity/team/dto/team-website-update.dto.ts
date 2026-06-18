import { ArrayMaxSize, IsNotEmpty, IsNumber,  Min } from "class-validator";

export class TeamWebsiteUpdateDTO {

  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "Website IDs must be numbers.", each: true })
  @ArrayMaxSize(500, { message: "Cannot update more than 500 websites at each request." })
  @Min(1, { message: "Website IDs must be positive integers.", each: true })
  websiteIds: number[];

}
