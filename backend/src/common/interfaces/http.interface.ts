import { Request } from 'express';
import { AuthPrincipal } from '../../modules/auth/auth.types';

export interface RequestContext {
  requestId: string;
}

export interface RequestWithContext extends Request {
  requestId?: string;
  user?: AuthPrincipal;
}
