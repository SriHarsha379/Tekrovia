import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: { email: string; phone: string; name: string; password?: string }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name: data.name,
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

  async login(data: { email: string; otp?: string; password?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new BadRequestException('User not found');

    if (data.password && user.passwordHash) {
      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) throw new BadRequestException('Invalid password');
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.oTPCode.create({
      data: {
        userId: user.id,
        purpose: 'login',
        code: otp,
        expiresAt,
      },
    });

    return {
      userId: user.id,
      otp,
      expiresAt,
      message: 'OTP generated for login verification.',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const otpRecord = await this.prisma.oTPCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'login',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.code !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

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
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
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
}
