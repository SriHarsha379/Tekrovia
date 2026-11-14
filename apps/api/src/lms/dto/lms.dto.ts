import {
  IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityStatus, SubmissionStatus } from '@prisma/client';

export class UpdateActivityDto {
  @ApiProperty({ enum: ActivityStatus })
  @IsEnum(ActivityStatus)
  status!: ActivityStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;
}

export class SubmitAssignmentDto {
  @ApiProperty()
  @IsUrl()
  submissionUrl!: string;
}

export class SubmitProjectDto {
  @ApiProperty()
  @IsUrl()
  submissionUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

export class ReviewProjectDto {
  @ApiProperty({
    enum: [SubmissionStatus.MENTOR_APPROVED, SubmissionStatus.REJECTED],
  })
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  feedback!: string;
}
