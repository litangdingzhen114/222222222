import { createHash, randomBytes } from 'crypto';

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createOpaqueToken() {
  return randomBytes(48).toString('base64url');
}
