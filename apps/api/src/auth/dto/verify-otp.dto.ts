import { IsEmail, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => (value as string).trim().toLowerCase())
  email!: string;

  @ApiProperty({ description: '6-digit OTP sent to your email/phone' })
  @IsString()
  @Length(6, 6, { message: 'otp must be exactly 6 digits' })
  otp!: string;
}
