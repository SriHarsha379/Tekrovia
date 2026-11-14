import { IsArray, ValidateNested, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerItemDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  answerIndex!: number;
}

export class SubmitInteractiveDto {
  @ApiProperty({ type: [AnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
}
