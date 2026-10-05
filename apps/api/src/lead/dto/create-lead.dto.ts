import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

export class CreateLeadDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @Transform(normalizePhone)
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'phone must be 10 to 15 digits, optionally starting with +',
  })
  phone!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  courseInterest?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  utmSource?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  utmMedium?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  utmCampaign?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  utmContent?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  utmTerm?: string;

  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;
}
