import { PrismaService } from '../prisma/prisma.service';
import { CandidateService } from './candidate.service';

describe('CandidateService.createForUser registration fields', () => {
  const user = {
    id: 'user-1',
    email: 'asha@example.test',
    phone: '9876543210',
    name: 'Asha',
    role: 'STUDENT',
    isVerified: true,
    isActive: true,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
  };

  const tx = {
    user: { update: jest.fn() },
    candidate: { create: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    candidate: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const base = {
    fullName: 'Asha Rao',
    email: 'asha@example.test',
    phone: '9876543210',
  };

  let service: CandidateService;

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.candidate.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );
    tx.user.update.mockResolvedValue({});
    tx.candidate.create.mockResolvedValue({ id: 'cand-1' });
    service = new CandidateService(prisma as unknown as PrismaService);
  });

  it('stores earlier training, the career gap and the resume link', async () => {
    await service.createForUser('user-1', {
      ...base,
      previousTraining: 'Python bootcamp',
      careerGapMonths: 8,
      resumeUrl: 'https://drive.example.test/resume.pdf',
    });

    const data = tx.candidate.create.mock.calls[0][0].data;
    expect(data.previousTraining).toBe('Python bootcamp');
    expect(data.careerGapMonths).toBe(8);
    expect(data.resumeUrl).toBe('https://drive.example.test/resume.pdf');
  });

  it('defaults the career gap to zero and leaves earlier training empty', async () => {
    await service.createForUser('user-1', base);

    const data = tx.candidate.create.mock.calls[0][0].data;
    expect(data.careerGapMonths).toBe(0);
    expect(data.previousTraining).toBeUndefined();
  });

  it('keeps a career gap of zero as zero', async () => {
    await service.createForUser('user-1', { ...base, careerGapMonths: 0 });

    expect(tx.candidate.create.mock.calls[0][0].data.careerGapMonths).toBe(0);
  });

  it('still takes email and phone from the registered account', async () => {
    await service.createForUser('user-1', base);

    const data = tx.candidate.create.mock.calls[0][0].data;
    expect(data.userId).toBe('user-1');
    expect(data.email).toBe('asha@example.test');
    expect(data.phone).toBe('9876543210');
  });
});
