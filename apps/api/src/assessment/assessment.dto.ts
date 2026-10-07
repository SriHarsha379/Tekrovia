import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AnswerDto {
  @IsString()
  questionId: string = '';

  @IsOptional()
  @IsNumber()
  selectedAnswer?: number;

  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class CreateAssessmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class SubmitAssessmentDto {
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[] = [];
}
