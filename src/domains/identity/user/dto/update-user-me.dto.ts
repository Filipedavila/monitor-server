import { IsNotEmpty, IsOptional, IsString, IsStrongPassword, ValidateIf } from "class-validator";

export class UpdateMeDTO {
  @IsString({ message: "Names must be a string." })
  @IsOptional()
  names: string;

  @IsString({ message: "Email must be a string." })
  @IsOptional()
  email: string;

  @ValidateIf(o => o.newPassword !== undefined)
  @IsString({ message: "Current password must be a string." })
  @IsNotEmpty({ message: 'To change the password, you must provide the current password.' })
  readonly currentPassword!: string;
  
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
  @IsOptional()
  @IsString({ message: "New password must be a string." })
  newPassword: string;
}
