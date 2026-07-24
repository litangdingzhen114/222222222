import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithContext } from '../interfaces/http.interface';
import { AuthPrincipal } from '../../modules/auth/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    return request.user;
  },
);
