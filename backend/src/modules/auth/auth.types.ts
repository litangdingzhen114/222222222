import { AdminRole, TokenSubjectType } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  typ: TokenSubjectType;
  role?: AdminRole;
  tokenId: string;
}

export interface AuthPrincipal {
  id: string;
  type: TokenSubjectType;
  role?: AdminRole;
  tokenId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
