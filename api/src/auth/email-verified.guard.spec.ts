import { ForbiddenException } from '@nestjs/common';
import { EmailVerifiedGuard } from './email-verified.guard';

describe('EmailVerifiedGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const guard = new EmailVerifiedGuard(reflector as never);

  function context(user?: { emailVerified: boolean }) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    };
  }

  it('blocks unverified users from owned resources', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    expect(() =>
      guard.canActivate(context({ emailVerified: false }) as never),
    ).toThrow(ForbiddenException);
  });

  it('allows verified users', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    expect(guard.canActivate(context({ emailVerified: true }) as never)).toBe(
      true,
    );
  });
});
