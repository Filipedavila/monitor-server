import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { User } from "../../user.entity";

export class UserFilterDTO extends BaseFilterDTO<User> implements Required<Pick<User, "id" | "username" | "email" | "fullName">> {
 
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  id: number;

  @IsOptional()
  @IsString( {message: "Username must be a string."} )
  username: string;

  @IsOptional()
  @IsString( {message: "Email must be a string."} )
  email: string;

  @IsOptional()
  @IsString( {message: "Full name must be a string."} )
  fullName: string;
}
