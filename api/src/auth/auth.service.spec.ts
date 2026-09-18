/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { ForbiddenException } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { AuthService } from './auth.service';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

jest.mock('./apple-auth.service', () => ({
  AppleAuthService: class AppleAuthService {},
}));

jest.mock('jose', () => ({}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(prisma),
    ),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };
  const mailer = { send: jest.fn() };
  const categories = { seedDefaults: jest.fn() };
  const appleAuth = { verifyIdentityToken: jest.fn() };

  const service = new AuthService(
    prisma as never,
    jwt as never,
    mailer as never,
    categories as never,
    appleAuth,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('token');
  });

  it('rejects login when the email is not verified', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: '$2a$12$abcdefghijklmnopqrstuv',
      emailVerifiedAt: null,
      primaryCurrency: Currency.RSD,
      appleUserId: null,
    });
    await expect(
      service.login({ email: 'a@b.com', password: 'password1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('links Apple identity to an existing email instead of creating a second user', async () => {
    appleAuth.verifyIdentityToken.mockResolvedValue({
      appleUserId: 'apple-1',
      email: 'same@example.com',
    });
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'u1',
      email: 'same@example.com',
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
      primaryCurrency: Currency.RSD,
      appleUserId: null,
    });
    prisma.user.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'u1',
        email: 'same@example.com',
        passwordHash: 'hash',
        emailVerifiedAt: new Date(),
        primaryCurrency: Currency.RSD,
        appleUserId: data.appleUserId,
      }),
    );

    const result = await service.appleSignIn({ identityToken: 'jwt' });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
    expect(result.accessToken).toBe('token');
  });
});
