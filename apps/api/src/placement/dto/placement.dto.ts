import {
  IsEnum, IsOptional, IsString, IsUUID, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PipelineStage, SubmissionChannel } from '@prisma/client';

export class CreatePlacementDto {
  @ApiProperty()
  @IsUUID()
  jobPostingId!: string;
}

export class UpdateStageDto {
  @ApiProperty({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  stage!: PipelineStage;

  @ApiProperty({ required: false, enum: SubmissionChannel })
  @IsOptional()
  @IsEnum(SubmissionChannel)
  channel?: SubmissionChannel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  blocker?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nextAction?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class LogInterviewRoundDto {
  @ApiProperty()
  @IsString()
  outcome!: 'pending' | 'cleared' | 'rejected';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

export class CreateJobPostingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(150)
  clientName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  roleTitle!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}
