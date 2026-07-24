import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';
import { RequestWithContext } from '../interfaces/http.interface';

export function requestIdMiddleware(
  request: RequestWithContext,
  response: Response,
  next: NextFunction,
) {
  const incoming = request.header('x-request-id');
  const requestId = incoming && incoming.length <= 80 ? incoming : randomUUID();
  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}
