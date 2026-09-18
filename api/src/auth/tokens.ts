import { createHash, randomBytes } from 'node:crypto';

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test-jwt-secret';
  }
  throw new Error('JWT_SECRET is required');
}
