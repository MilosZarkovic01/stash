import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_UNVERIFIED_KEY, IS_PUBLIC_KEY } from '../common/auth.decorators';
import type { AuthUser } from '../common/auth-user';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowUnverified = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNVERIFIED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowUnverified) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user?.emailVerified) {
      throw new ForbiddenException('Email is not verified');
    }
    return true;
  }
}
