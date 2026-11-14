import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: 'A record with the given details already exists.',
            error: 'Conflict',
          });
        case 'P2025':
          return response.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'The requested record was not found.',
            error: 'Not Found',
          });
        case 'P2003':
          return response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Related record not found.',
            error: 'Bad Request',
          });
        default:
          this.logger.error(
            `Unhandled Prisma error ${exception.code}`,
            exception.message,
          );
          return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected database error occurred.',
            error: 'Internal Server Error',
          });
      }
    }

    // PrismaClientValidationError — bad query shape, never expose details
    this.logger.error('Prisma validation error', exception.message);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
      error: 'Internal Server Error',
    });
  }
}
