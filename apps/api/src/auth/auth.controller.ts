import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user and issue initial verification state' })
  register(@Body() body: { email: string; phone: string; name: string; password?: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login via OTP or password' })
  login(@Body() body: { email: string; otp?: string; password?: string }) {
    return this.authService.login(body);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for completed login' })
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }
}
