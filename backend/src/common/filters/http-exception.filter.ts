import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../exceptions/app.exception';
import { RequestWithContext } from '../interfaces/http.interface';

interface ErrorBody {
  code?: number;
  message?: string | string[];
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const response = ctx.getResponse<Response>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? this.normalize(exception.getResponse()) : undefined;
    const message = this.resolveMessage(body, exception, status);
    const code = body?.code ?? this.resolveCode(status);

    if (status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(status).json({
      code,
      message,
      data: null,
      requestId: request.requestId ?? '',
      timestamp: Date.now(),
      ...(process.env.NODE_ENV !== 'production' && body?.details ? { details: body.details } : {}),
    });
  }

  private normalize(response: string | object): ErrorBody {
    if (typeof response === 'string') {
      return { message: response };
    }
    return response;
  }

  private resolveMessage(body: ErrorBody | undefined, exception: unknown, status: number): string {
    if (Array.isArray(body?.message)) {
      return body.message.join('; ');
    }
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (exception instanceof Error && status >= 500) {
      return process.env.NODE_ENV === 'production' ? 'internal server error' : exception.message;
    }
    return 'request failed';
  }

  private resolveCode(status: number): number {
    if (status === 401) return ErrorCode.UNAUTHORIZED;
    if (status === 403) return ErrorCode.FORBIDDEN;
    if (status === 404) return ErrorCode.NOT_FOUND;
    if (status === 409) return ErrorCode.CONFLICT;
    if (status === 422) return ErrorCode.VALIDATION_FAILED;
    if (status === 429) return ErrorCode.RATE_LIMITED;
    if (status >= 500) return ErrorCode.INTERNAL_ERROR;
    return ErrorCode.BAD_REQUEST;
  }
}
