import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      cookies?: { tekrovia_token?: string };
      user?: unknown;
    }>();

    // Fix 11: accept token from Authorization header OR the httpOnly cookie
    const fromHeader = request.headers?.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice('Bearer '.length).trim()
      : undefined;

    const fromCookie = request.cookies?.tekrovia_token?.trim();

    const accessToken = fromHeader ?? fromCookie;

    if (!accessToken) {
      throw new UnauthorizedException('Authentication required.');
    }

    const user = await this.authService.validateAccessToken(accessToken);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    request.user = user;
    return true;
  }
}
