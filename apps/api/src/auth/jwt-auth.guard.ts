import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const accessToken = header.slice(7).trim();
    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const session = await this.prisma.session.findUnique({
      where: { accessToken },
      include: { user: true },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session expired or invalid.');
    }

    if (!session.user || !session.user.isActive) {
      throw new UnauthorizedException('Account is not active.');
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };

    return true;
  }
}
