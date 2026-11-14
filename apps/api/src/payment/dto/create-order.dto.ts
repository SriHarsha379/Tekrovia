import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCode } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ enum: ProductCode, isArray: true })
  @IsEnum(ProductCode, { each: true })
  products!: ProductCode[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty()
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty()
  @IsString()
  razorpaySignature!: string;
}
