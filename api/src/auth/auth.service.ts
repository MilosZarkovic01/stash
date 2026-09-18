import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Currency, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../database/prisma.service';
import { AppleAuthService } from './apple-auth.service';
import {
  AppleSignInDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { MailerService } from './mailer.service';
import { generateOpaqueToken, hashOpaqueToken } from './tokens';

const VERIFICATION_HOURS = 24;
const RESET_HOURS = 1;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    private readonly categories: CategoriesService,
    private readonly appleAuth: AppleAuthService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        primaryCurrency: dto.primaryCurrency ?? Currency.RSD,
      },
    });
    await this.categories.seedDefaults(user.id);
    await this.sendVerification(user);
    return {
      message: 'Check your email to verify your account',
      user: this.publicUser(user),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email is not verified');
    }
    return this.issueSession(user);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = hashOpaqueToken(dto.token);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    const user = await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.deleteMany({
        where: { userId: record.userId },
      });
      return tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });
    });
    return this.issueSession(user);
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (user && !user.emailVerifiedAt) {
      await this.sendVerification(user);
    }
    return { message: 'If the account exists, a verification email was sent' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (user?.passwordHash) {
      const token = generateOpaqueToken();
      const expiresAt = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashOpaqueToken(token),
          expiresAt,
        },
      });
      const appUrl = process.env.APP_PUBLIC_URL ?? 'http://localhost:8081';
      await this.mailer.send(
        user.email,
        'Reset your Stash password',
        `Reset your password: ${appUrl}/reset-password?token=${token}`,
      );
    }
    return { message: 'If the account exists, a reset email was sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashOpaqueToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      });
      return tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
    });
    return this.issueSession(user);
  }

  async appleSignIn(dto: AppleSignInDto) {
    const identity = await this.appleAuth.verifyIdentityToken(
      dto.identityToken,
    );
    const email = (identity.email ?? dto.email)?.toLowerCase().trim() ?? null;

    const byApple = await this.prisma.user.findUnique({
      where: { appleUserId: identity.appleUserId },
    });
    if (byApple) {
      return this.issueSession(byApple);
    }

    if (email) {
      const byEmail = await this.prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        if (
          byEmail.appleUserId &&
          byEmail.appleUserId !== identity.appleUserId
        ) {
          throw new ConflictException(
            'Email is already linked to another Apple account',
          );
        }
        const linked = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            appleUserId: identity.appleUserId,
            emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
          },
        });
        return this.issueSession(linked);
      }
    }

    if (!email) {
      throw new UnauthorizedException(
        'Apple did not provide an email for this account',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        appleUserId: identity.appleUserId,
        emailVerifiedAt: new Date(),
      },
    });
    await this.categories.seedDefaults(user.id);
    return this.issueSession(user);
  }

  private async sendVerification(user: User) {
    const token = generateOpaqueToken();
    const expiresAt = new Date(
      Date.now() + VERIFICATION_HOURS * 60 * 60 * 1000,
    );
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt,
      },
    });
    const appUrl = process.env.APP_PUBLIC_URL ?? 'http://localhost:8081';
    await this.mailer.send(
      user.email,
      'Verify your Stash account',
      `Verify your email: ${appUrl}/verify?token=${token}`,
    );
  }

  private async issueSession(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return { accessToken, user: this.publicUser(user) };
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      primaryCurrency: user.primaryCurrency,
      hasApple: Boolean(user.appleUserId),
    };
  }
}
