import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { User } from "../../user.entity";

export class UserFilterDTO extends BaseFilterDTO<User> implements Required<Pick<User, "id" | "username">> {
 
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  id: number;

  @IsOptional()
  @IsString( {message: "Username must be a string."} )
  username: string;

  @IsOptional()
  @IsString( {message: "Search term must be a string."} )
  searchTerm: string;

  @IsOptional()
  @IsString( {message: "Role must be a string."} )
  role: string;
}
