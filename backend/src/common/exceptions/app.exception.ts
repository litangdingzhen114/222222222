import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: number,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super({ code: errorCode, message, details }, status);
  }
}

export const ErrorCode = {
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  RATE_LIMITED: 42900,
  VALIDATION_FAILED: 42200,
  PAYMENT_PROVIDER_NOT_CONFIGURED: 50010,
  THIRD_PARTY_ERROR: 50200,
  INTERNAL_ERROR: 50000,
} as const;
