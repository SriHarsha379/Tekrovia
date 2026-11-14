import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DoubtDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  question!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  course_title?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  lesson_title?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(1000)
  context?: string;
}
