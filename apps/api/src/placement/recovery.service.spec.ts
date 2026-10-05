import { PlacementInterviewOutcome } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlacementService, RECOVERY_THRESHOLD } from './placement.service';

describe('PlacementService recovery flag', () => {
  const prisma = {
    candidate: { findUnique: jest.fn() },
    placementInterview: { findMany: jest.fn() },
  };

  let service: PlacementService;

  const interview = (round: number, overrides: Record<string, unknown> = {}) => ({
    id: `int-${round}`,
    round,
    title: `Round ${round}`,
    scheduledAt: new Date(`2026-09-0${round}T10:00:00Z`),
    feedback: `Reason ${round}`,
    application: { companyName: `Company ${round}`, jobTitle: 'Backend Developer' },
    ...overrides,
  });

  beforeEach(() => {
    prisma.candidate.findUnique.mockResolvedValue({
      id: 'cand-1',
      fullName: 'Asha Rao',
      email: 'asha@example.test',
      phone: '9876543210',
      skills: [],
      assessments: [],
      expertMockInterviews: [],
      projectReviews: [],
      readinessReview: null,
    });
    prisma.placementInterview.findMany.mockResolvedValue([]);
    service = new PlacementService(prisma as unknown as PrismaService);
  });

  it('uses a threshold of four', () => {
    expect(RECOVERY_THRESHOLD).toBe(4);
  });

  it('counts only failed interviews belonging to the candidate', async () => {
    await service.getCandidateReadiness('cand-1');

    expect(prisma.placementInterview.findMany).toHaveBeenCalledTimes(1);
    const args = prisma.placementInterview.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      outcome: PlacementInterviewOutcome.FAILED,
      application: { candidateId: 'cand-1' },
    });
    expect(args.orderBy).toEqual({ scheduledAt: 'desc' });
  });

  it('reports no recovery need for a candidate without failed interviews', async () => {
    const result = await service.getCandidateReadiness('cand-1');

    expect(result.recovery).toEqual({
      threshold: 4,
      failedInterviewCount: 0,
      recoveryNeeded: false,
      failedInterviews: [],
    });
  });

  it.each([1, 2, 3])('does not flag %s failed interviews', async (count) => {
    prisma.placementInterview.findMany.mockResolvedValue(
      Array.from({ length: count }, (_value, index) => interview(index + 1)),
    );

    const result = await service.getCandidateReadiness('cand-1');

    expect(result.recovery.failedInterviewCount).toBe(count);
    expect(result.recovery.recoveryNeeded).toBe(false);
  });

  it.each([4, 5, 7])('flags recovery at %s failed interviews', async (count) => {
    prisma.placementInterview.findMany.mockResolvedValue(
      Array.from({ length: count }, (_value, index) => interview(index + 1)),
    );

    const result = await service.getCandidateReadiness('cand-1');

    expect(result.recovery.failedInterviewCount).toBe(count);
    expect(result.recovery.recoveryNeeded).toBe(true);
  });

  it('lists each failed interview with its company, round, date and reason', async () => {
    prisma.placementInterview.findMany.mockResolvedValue([interview(2), interview(1)]);

    const result = await service.getCandidateReadiness('cand-1');

    expect(result.recovery.failedInterviews).toEqual([
      {
        id: 'int-2',
        companyName: 'Company 2',
        jobTitle: 'Backend Developer',
        round: 2,
        title: 'Round 2',
        scheduledAt: new Date('2026-09-02T10:00:00Z'),
        feedback: 'Reason 2',
      },
      {
        id: 'int-1',
        companyName: 'Company 1',
        jobTitle: 'Backend Developer',
        round: 1,
        title: 'Round 1',
        scheduledAt: new Date('2026-09-01T10:00:00Z'),
        feedback: 'Reason 1',
      },
    ]);
  });

  it('keeps a missing reason as null instead of inventing one', async () => {
    prisma.placementInterview.findMany.mockResolvedValue([
      interview(1, { feedback: null }),
    ]);

    const result = await service.getCandidateReadiness('cand-1');

    expect(result.recovery.failedInterviews[0].feedback).toBeNull();
  });

  it('never changes the readiness decision or evidence because of failures', async () => {
    prisma.placementInterview.findMany.mockResolvedValue(
      [1, 2, 3, 4].map((round) => interview(round)),
    );

    const result = await service.getCandidateReadiness('cand-1');

    expect(result.decision).toBe('PENDING');
    expect(result.allEvidenceComplete).toBe(false);
    expect(result.approvalRequiresHumanReview).toBe(true);
  });
});
