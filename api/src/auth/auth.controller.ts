import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../common/auth.decorators';
import { AuthService } from './auth.service';
import {
  AppleSignInDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('apple')
  @HttpCode(200)
  apple(@Body() dto: AppleSignInDto) {
    return this.auth.appleSignIn(dto);
  }

  @Post('logout')
  @HttpCode(204)
  logout(): void {
    return;
  }
}
