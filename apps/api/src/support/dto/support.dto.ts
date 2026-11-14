import {
  IsEnum, IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketCategory, TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ enum: TicketCategory })
  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}

export class AddCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;
}
