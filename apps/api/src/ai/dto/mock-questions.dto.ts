import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MockQuestionsDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(100)
  round_type?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsInt() @Min(1) @Max(50)
  num_questions?: number;
}
