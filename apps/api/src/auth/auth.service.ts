import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function hashesMatch(storedHash: string, suppliedHash: string): boolean {
  const stored = Buffer.from(storedHash, 'hex');
  const supplied = Buffer.from(suppliedHash, 'hex');

  return (
    stored.length === supplied.length &&
    timingSafeEqual(stored, supplied)
  );
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: {
    email: string;
    phone: string;
    name: string;
    password?: string;
  }) {
    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: data.phone }],
      },
    });

    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 12)
      : null;

    const user = await this.prisma.user.create({
      data: {
        email,
        phone: data.phone,
        name: data.name.trim(),
        passwordHash,
        role: 'STUDENT',
        isVerified: !data.password,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      requiresOtp: !data.password,
    };
  }

  async login(data: {
    email: string;
    otp?: string;
    password?: string;
  }) {
    const email = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid login details.');
    }

    if (data.password !== undefined) {
      if (!user.passwordHash) {
        throw new BadRequestException(
          'Password login is not enabled for this account. Use OTP.',
        );
      }

      const valid = await bcrypt.compare(
        data.password,
        user.passwordHash,
      );

      if (!valid) {
        throw new BadRequestException('Invalid login details.');
      }
    }

    // Fail closed: an OTP is only generated and returned when a developer
    // explicitly opts in with ALLOW_DEV_OTP_RESPONSE=true. It is never
    // available in production, regardless of the flag, until a real
    // delivery provider (email/SMS) is configured.
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.ALLOW_DEV_OTP_RESPONSE !== 'true'
    ) {
      throw new ServiceUnavailableException(
        'OTP delivery is not configured. Please try again later.',
      );
    }

    const latestOtp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'login',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latestOtp &&
      Date.now() - latestOtp.createdAt.getTime() <
        OTP_RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Please wait before requesting another OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Invalidate older login OTPs so only the newest one can work.
    await this.prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        purpose: 'login',
      },
    });

    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        purpose: 'login',
        code: hashOtp(otp),
        expiresAt,
        attempts: 0,
        verifiedAt: null,
      },
    });

    return {
      userId: user.id,
      otp,
      expiresAt,
      message: 'Development OTP generated.',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'login',
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many incorrect OTP attempts. Request a new code later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const suppliedHash = hashOtp(otp);
    const valid = hashesMatch(otpRecord.code, suppliedHash);

    if (!valid) {
      const updated = await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      if (updated.attempts >= OTP_MAX_ATTEMPTS) {
        throw new HttpException(
          'Too many incorrect OTP attempts. Request a new code later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new BadRequestException('Invalid or expired OTP.');
    }

    // Delete the code after successful verification to prevent reuse.
    await this.prisma.otpCode.delete({
      where: { id: otpRecord.id },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    const accessToken = uuidv4();
    const refreshToken = uuidv4();

    await this.prisma.session.create({
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7,
        ),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateAccessToken(accessToken: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        accessToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || !session.user.isActive) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };
  }
}
