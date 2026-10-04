import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LocalLoginDto {
    @IsString({message: 'Username must be a string'})
    @IsNotEmpty({message: 'Username must not be empty'})
    @Transform(({ value }) => value?.trim())
    username: string;

    @IsString({message: 'Password must be a string'})
    @IsNotEmpty({message: 'Password must not be empty'})
    @Transform(({ value }) => value?.trim())
    password: string;
}