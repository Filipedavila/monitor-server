import { IsIn,IsNotEmpty, IsStrongPassword,IsNumber,IsString, IsOptional, MaxLength, MinLength, IsEmail,} from "class-validator";
import { RoleSlug } from "src/core/authentication/interfaces/types";

export class CreateUserDto {
  @IsString({ message: "Username must be a string." })
  @IsNotEmpty({ message: "Username is required." })
  username: string;
  @IsString({ message: "Names must be a string." })
  @IsNotEmpty({ message: "Names are required." })
  names: string;
  @IsString({ message: "Email must be a string." })
  @IsNotEmpty({ message: "Email is required." })
  @IsEmail({}, { message: "Email must be a valid email address." })
  email: string;
  @IsString({ message: "Role must be a string." })
  @IsNotEmpty({ message: "Role is required." })
  @IsIn([RoleSlug.ADMIN, RoleSlug.MONITOR],
     { message: "Role must be one of the following values: nimda,  monitor." })
  role: string;

  @IsOptional()
  @IsString({ message: "Citizen card number must be a string" })
  @MinLength(1, { message: "Citizen card number cannot be empty" })
  @MaxLength(30, { message: "Citizen card number is too long" })
  ccNumber: string;

  @IsString({ message: "Password must be a string." })
  @IsNotEmpty({ message: "Password is required." })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { 
      message: 'Password is too weak. It must contain at least 8 characters, including uppercase, lowercase, numbers, and symbols.' 
    }
  )
  password: string;

}
