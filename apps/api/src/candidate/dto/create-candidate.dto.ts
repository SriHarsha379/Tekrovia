import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
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
  @MaxLength(2000)
  @Matches(/^https:\/\/[^\s@/]+(?::\d+)?(?:[/?#]\S*)?$/, {
    message: 'resumeUrl must be an https link',
  })
  resumeUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  previousTraining?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  careerGapMonths?: number;

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
  @MaxLength(200)
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmContent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
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
