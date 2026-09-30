import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCandidateDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  graduationYear?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  experienceYears?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  codingPreference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  learningAvailability?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preferredSchedule?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courseInterest?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  campaignSource?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmContent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmTerm?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  communicationPrefs?: string;
}
