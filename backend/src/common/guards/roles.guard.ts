import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, TokenSubjectType } from '@prisma/client';
import { ROLES_KEY } from '../constants/metadata.constants';
import { RequestWithContext } from '../interfaces/http.interface';

const ROLE_LEVEL: Record<AdminRole, number> = {
  CONTENT_OPERATOR: 10,
  MALL_OPERATOR: 10,
  ADMIN: 50,
  SUPER_ADMIN: 100,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const principal = request.user;
    if (!principal || principal.type !== TokenSubjectType.ADMIN || !principal.role) {
      throw new ForbiddenException('admin permission required');
    }

    if (required.includes(principal.role)) {
      return true;
    }
    const highestRequired = Math.min(...required.map((role) => ROLE_LEVEL[role]));
    if (ROLE_LEVEL[principal.role] >= highestRequired && principal.role === AdminRole.SUPER_ADMIN) {
      return true;
    }
    if (principal.role === AdminRole.ADMIN && !required.includes(AdminRole.SUPER_ADMIN)) {
      return true;
    }
    throw new ForbiddenException('insufficient role permission');
  }
}
