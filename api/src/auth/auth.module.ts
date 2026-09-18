import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CategoriesModule } from '../categories/categories.module';
import { AppleAuthService } from './apple-auth.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerifiedGuard } from './email-verified.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MailerService } from './mailer.service';
import { getJwtSecret } from './tokens';

@Module({
  imports: [
    CategoriesModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailerService,
    AppleAuthService,
    JwtAuthGuard,
    EmailVerifiedGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: EmailVerifiedGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
