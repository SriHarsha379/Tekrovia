import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService.login dev OTP gating', () => {
  const env = process.env as Record<string, string | undefined>;
  const originalNodeEnv = env.NODE_ENV;
  const originalFlag = env.ALLOW_DEV_OTP_RESPONSE;

  const prisma = {
    user: { findUnique: jest.fn() },
    otpCode: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: AuthService;

  function restoreEnv(key: string, value: string | undefined) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      isActive: true,
      passwordHash: null,
    });
    prisma.otpCode.findFirst.mockResolvedValue(null);
    prisma.otpCode.deleteMany.mockResolvedValue({ count: 0 });
    prisma.otpCode.create.mockResolvedValue({});
    service = new AuthService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    restoreEnv('NODE_ENV', originalNodeEnv);
    restoreEnv('ALLOW_DEV_OTP_RESPONSE', originalFlag);
  });

  it('returns a 6-digit OTP and stores only its hash when the dev flag is on', async () => {
    env.NODE_ENV = 'development';
    env.ALLOW_DEV_OTP_RESPONSE = 'true';

    const result = await service.login({ email: 'student@example.com' });

    expect(result.otp).toMatch(/^\d{6}$/);
    expect(prisma.otpCode.create).toHaveBeenCalledTimes(1);
    const stored = prisma.otpCode.create.mock.calls[0][0].data.code;
    expect(stored).not.toBe(result.otp);
    expect(stored).toHaveLength(64);
  });

  it('refuses and creates no OTP when the dev flag is unset', async () => {
    env.NODE_ENV = 'development';
    delete env.ALLOW_DEV_OTP_RESPONSE;

    await expect(
      service.login({ email: 'student@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });

  it('refuses when the dev flag is anything other than "true"', async () => {
    env.NODE_ENV = 'staging';
    env.ALLOW_DEV_OTP_RESPONSE = 'false';

    await expect(
      service.login({ email: 'student@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });

  it('refuses in production even when the dev flag is on', async () => {
    env.NODE_ENV = 'production';
    env.ALLOW_DEV_OTP_RESPONSE = 'true';

    await expect(
      service.login({ email: 'student@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });
});
