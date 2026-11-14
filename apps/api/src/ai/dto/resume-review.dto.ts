import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResumeReviewDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50_000)
  resume_text!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(5000)
  job_description?: string;
}
