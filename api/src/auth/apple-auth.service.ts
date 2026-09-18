import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jose from 'jose';

export type AppleIdentity = {
  appleUserId: string;
  email: string | null;
};

@Injectable()
export class AppleAuthService {
  async verifyIdentityToken(identityToken: string): Promise<AppleIdentity> {
    const audience = process.env.APPLE_CLIENT_ID;
    if (!audience) {
      throw new ServiceUnavailableException(
        'Sign in with Apple is not configured',
      );
    }

    try {
      const JWKS = jose.createRemoteJWKSet(
        new URL('https://appleid.apple.com/auth/keys'),
      );
      const { payload } = await jose.jwtVerify(identityToken, JWKS, {
        issuer: 'https://appleid.apple.com',
        audience,
      });
      const appleUserId = payload.sub;
      if (!appleUserId) {
        throw new UnauthorizedException('Invalid Apple identity token');
      }
      const email =
        typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
      return { appleUserId, email };
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Apple identity token');
    }
  }
}
