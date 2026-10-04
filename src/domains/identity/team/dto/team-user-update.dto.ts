import { ArrayMaxSize, IsNotEmpty, IsNumber,  Min } from "class-validator";

export class TeamUserUpdateDTO {
  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: "User IDs must be numbers.", each: true })
  @ArrayMaxSize(500, { message: "Cannot update more than 500 users at each request." })
  @Min(1, { message: "User IDs must be positive integers.", each: true })
  userIds: number[];

}
