import {
  Body, Controller, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthService } from './auth.service';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() body: { email: string; phone: string; name: string; password?: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Request OTP or validate password' })
  login(@Body() body: { email: string; otp?: string; password?: string }) {
    return this.authService.login(body);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and get session token' })
  async verifyOtp(
    @Body() body: { email: string; otp: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(body.email, body.otp);

    // Set cookie server-side so it persists across refreshes
    res.cookie('tekrovia_token', result.accessToken, {
      httpOnly: false,   // false so JS can also read it
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      secure: false,     // false for localhost
    });

    return result;
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(SessionAuthGuard)
  async logout(
    @Req() request: AuthenticatedRequest & { headers: { authorization?: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? '';

    // Clear the cookie server-side
    res.clearCookie('tekrovia_token', { path: '/' });

    return this.authService.logout(token);
  }
}
