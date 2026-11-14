import {
  IsDateString, IsEnum, IsNumber, IsOptional,
  IsString, MaxLength, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channel!: ChannelType;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(255)
  targetAudience?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(100)
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(100)
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(100)
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(100)
  utmContent?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(100)
  utmTerm?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber() @Min(0)
  budget?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsDateString()
  endDate?: string;
}
