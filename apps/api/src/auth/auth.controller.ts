import {
  Body, Controller, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
  headers: { authorization?: string };
  cookies?: { tekrovia_token?: string };
}

const COOKIE_NAME = 'tekrovia_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Request OTP or validate password' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and get session token' })
  async verifyOtp(
    @Body() body: { email: string; otp: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(body.email, body.otp);

    res.cookie(COOKIE_NAME, result.accessToken, {
      httpOnly: true,                                          // Fix 1: prevent JS access
      secure: process.env.NODE_ENV === 'production',          // Fix 2: HTTPS only in prod
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return result;
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(SessionAuthGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      request.headers.authorization?.replace('Bearer ', '').trim() ??
      request.cookies?.tekrovia_token ??
      '';

    res.clearCookie(COOKIE_NAME, { path: '/' });

    return this.authService.logout(token);
  }
}
