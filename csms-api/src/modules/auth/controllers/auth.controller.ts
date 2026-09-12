import { Controller, Get, Post, Body, Delete, Req, Param, Put } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AssignRolesDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';
import { Public } from '../rbac/public.decorator';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PERMISSIONS } from '../rbac/permissions';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  @RequirePermissions(PERMISSIONS.USER_READ)
  async getUsers() {
    return this.authService.findAllUsers();
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @Public()
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Delete('withdraw')
  async withdraw(@Req() req: any) {
    return this.authService.withdraw(req.user.userId);
  }

  @Delete('users/:id')
  @RequirePermissions(PERMISSIONS.USER_DISABLE)
  async disableUser(@Param('id') userId: string) {
    return this.authService.disableUser(userId);
  }

  @Put('users/:id/roles')
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  async assignRoles(@Param('id') userId: string, @Body() body: AssignRolesDto, @Req() req: any) {
    return this.authService.assignRoles(userId, body.roleCodes, req.user.roleCodes ?? []);
  }
}
