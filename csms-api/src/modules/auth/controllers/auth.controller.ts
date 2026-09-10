import { Controller, Get, Post, Body, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignupDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Get('users')
  async getUsers() {
    return this.authService.findAllUsers();
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('withdraw')
  async withdraw(@Req() req: any) {
    return this.authService.withdraw(req.user.userId);
  }
}
