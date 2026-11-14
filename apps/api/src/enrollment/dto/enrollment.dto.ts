import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@prisma/client';

export class AssignBatchDto {
  @ApiProperty()
  @IsUUID()
  batchId!: string;
}

export class UpdateEnrollmentDto {
  @ApiProperty({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  status!: EnrollmentStatus;
}
