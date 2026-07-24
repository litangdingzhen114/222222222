import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { RequestWithContext } from '../interfaces/http.interface';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<{ statusCode?: number }>();

    return next.handle().pipe(
      tap(() => {
        this.writeLog(request, response.statusCode ?? 200, Date.now() - startedAt);
      }),
      catchError((error: unknown) => {
        this.writeLog(request, response.statusCode ?? 500, Date.now() - startedAt, error);
        return throwError(() => error);
      }),
    );
  }

  private writeLog(
    request: RequestWithContext,
    statusCode: number,
    responseTime: number,
    error?: unknown,
  ) {
    const principal = request.user;
    const log = {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode,
      responseTime,
      userId: principal?.type === 'USER' ? principal.id : undefined,
      adminId: principal?.type === 'ADMIN' ? principal.id : undefined,
      ip: request.ip,
      userAgent: request.header('user-agent'),
      errorCode: error instanceof Error ? error.name : undefined,
    };
    const line = JSON.stringify(log);
    if (statusCode >= 500) {
      console.error(line);
    } else {
      console.info(line);
    }
  }
}
