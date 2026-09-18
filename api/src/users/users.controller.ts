import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AllowUnverified } from '../common/auth.decorators';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @AllowUnverified()
  me(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(user.id, dto);
  }
}
