import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, mergeMap } from 'rxjs';
import { NamingProfileService } from '../../modules/naming-profile/naming-profile.service';
import { SKIP_RESPONSE_WRAP_KEY } from '../constants/metadata.constants';
import { RequestWithContext } from '../interfaces/http.interface';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  requestId: string;
  timestamp: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(
    private readonly reflector: Reflector,
    private readonly namingProfile: NamingProfileService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_WRAP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    return next.handle().pipe(
      mergeMap(async (data) => {
        const path = request.originalUrl || request.url || '';
        const responseData = this.namingProfile.shouldTransformPath(path)
          ? await this.namingProfile.transformResponse(data)
          : data;
        return {
          code: 0,
          message: 'success',
          data: responseData,
          requestId: request.requestId ?? '',
          timestamp: Date.now(),
        };
      }),
    );
  }
}
