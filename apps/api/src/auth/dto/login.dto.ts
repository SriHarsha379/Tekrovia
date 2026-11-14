import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  otp?: string;
}
