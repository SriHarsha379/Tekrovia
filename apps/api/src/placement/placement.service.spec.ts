import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentStatus,
  AssessmentType,
  CandidateProjectStatus,
  ExpertMockInterviewStatus,
  PlacementApplicationStatus,
  PlacementInterviewStatus,
  PlacementOfferStatus,
  PlacementReadinessDecision,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';

describe('PlacementService', () => {
  let service: PlacementService;

  const prisma = {
    placementApplication: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    placementInterview: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    placementOffer: {
      groupBy: jest.fn(),
    },
    candidate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    placementReadinessReview: {
      upsert: jest.fn(),
    },
  };

  const completeCandidate = {
    id: 'candidate-1',
    assessments: [
      {
        id: 'assessment-1',
        type: AssessmentType.TECHNICAL,
        status: AssessmentStatus.REVIEWED,
        score: 12,
        maxScore: 15,
        updatedAt: new Date('2026-09-20T10:00:00.000Z'),
      },
    ],
    expertMockInterviews: [
      {
        id: 'mock-1',
        sequence: 1,
        status: ExpertMockInterviewStatus.COMPLETED,
        isFinal: false,
        score: 7,
        maxScore: 10,
      },
      {
        id: 'mock-2',
        sequence: 2,
        status: ExpertMockInterviewStatus.COMPLETED,
        isFinal: false,
        score: 8,
        maxScore: 10,
      },
      {
        id: 'mock-3',
        sequence: 3,
        status: ExpertMockInterviewStatus.COMPLETED,
        isFinal: true,
        score: 9,
        maxScore: 10,
      },
    ],
    projectReviews: [
      {
        id: 'project-1',
        status: CandidateProjectStatus.APPROVED,
        expertApproved: true,
        updatedAt: new Date('2026-09-21T10:00:00.000Z'),
      },
    ],
    readinessReview: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlacementService(prisma as unknown as PrismaService);
  });

  describe('overview', () => {
    it('aggregates application, interview and offer counts', async () => {
      const upcoming = [
        {
          id: 'interview-1',
          scheduledAt: new Date('2026-10-05T10:00:00.000Z'),
        },
      ];

      prisma.placementApplication.groupBy.mockResolvedValue([
        { status: PlacementApplicationStatus.APPLIED, _count: { _all: 3 } },
        { status: PlacementApplicationStatus.SHORTLISTED, _count: { _all: 2 } },
      ]);
      prisma.placementInterview.count.mockResolvedValue(4);
      prisma.placementOffer.groupBy.mockResolvedValue([
        { status: PlacementOfferStatus.PENDING, _count: { _all: 2 } },
        { status: PlacementOfferStatus.ACCEPTED, _count: { _all: 1 } },
      ]);
      prisma.placementInterview.findMany.mockResolvedValue(upcoming);

      const result = await service.overview();

      expect(result).toEqual({
        applicationCounts: {
          [PlacementApplicationStatus.APPLIED]: 3,
          [PlacementApplicationStatus.SHORTLISTED]: 2,
        },
        scheduledInterviewCount: 4,
        offerCounts: {
          [PlacementOfferStatus.PENDING]: 2,
          [PlacementOfferStatus.ACCEPTED]: 1,
        },
        upcomingInterviews: upcoming,
      });

      expect(prisma.placementApplication.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        _count: { _all: true },
      });
      expect(prisma.placementInterview.count).toHaveBeenCalledWith({
        where: { status: PlacementInterviewStatus.SCHEDULED },
      });
      expect(prisma.placementInterview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PlacementInterviewStatus.SCHEDULED,
            scheduledAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
          orderBy: { scheduledAt: 'asc' },
          take: 10,
        }),
      );
    });

    it('returns empty count maps when no applications or offers exist', async () => {
      prisma.placementApplication.groupBy.mockResolvedValue([]);
      prisma.placementInterview.count.mockResolvedValue(0);
      prisma.placementOffer.groupBy.mockResolvedValue([]);
      prisma.placementInterview.findMany.mockResolvedValue([]);

      const result = await service.overview();

      expect(result.applicationCounts).toEqual({});
      expect(result.scheduledInterviewCount).toBe(0);
      expect(result.offerCounts).toEqual({});
      expect(result.upcomingInterviews).toEqual([]);
    });
  });

  describe('getCandidateReadiness', () => {
    it('recognizes complete evidence and flags legacy technical assessment', async () => {
      prisma.candidate.findUnique.mockResolvedValue(completeCandidate);

      const result = await service.getCandidateReadiness('candidate-1');

      expect(result.candidateId).toBe('candidate-1');
      expect(result.checks).toMatchObject({
        expertMocks: {
          complete: true,
          completedCount: 3,
          requiredCount: 3,
        },
        finalExpertMock: {
          complete: true,
          score: 9,
          maxScore: 10,
          requiredScore: 8,
        },
        expertApprovedProject: {
          complete: true,
          approvedCount: 1,
        },
        technicalAssessment: {
          complete: true,
          score: 12,
          maxScore: 15,
          evidenceType: 'LEGACY_TECHNICAL_ASSESSMENT',
          formal15QuestionAssessmentVerified: false,
        },
      });
      expect(result.allEvidenceComplete).toBe(true);
      expect(result.decision).toBe(PlacementReadinessDecision.PENDING);
      expect(result.approvalRequiresHumanReview).toBe(true);
    });

    it('does not count incomplete mocks or unapproved projects as evidence', async () => {
      const candidate = {
        ...completeCandidate,
        expertMockInterviews: [
          ...completeCandidate.expertMockInterviews.slice(0, 2),
          {
            ...completeCandidate.expertMockInterviews[2],
            status: ExpertMockInterviewStatus.SCHEDULED,
          },
        ],
        projectReviews: [
          {
            id: 'project-1',
            status: CandidateProjectStatus.APPROVED,
            expertApproved: false,
            updatedAt: new Date(),
          },
        ],
      };
      prisma.candidate.findUnique.mockResolvedValue(candidate);

      const result = await service.getCandidateReadiness('candidate-1');

      expect(result.checks.expertMocks.complete).toBe(false);
      expect(result.checks.expertMocks.completedCount).toBe(2);
      expect(result.checks.finalExpertMock.complete).toBe(false);
      expect(result.checks.expertApprovedProject.complete).toBe(false);
      expect(result.allEvidenceComplete).toBe(false);
    });

    it('requires a final expert mock score of at least 80 percent', async () => {
      const candidate = {
        ...completeCandidate,
        expertMockInterviews: completeCandidate.expertMockInterviews.map(
          (mock) => mock.isFinal ? { ...mock, score: 7, maxScore: 10 } : mock,
        ),
      };
      prisma.candidate.findUnique.mockResolvedValue(candidate);

      const result = await service.getCandidateReadiness('candidate-1');

      expect(result.checks.finalExpertMock.complete).toBe(false);
      expect(result.allEvidenceComplete).toBe(false);
    });

    it('requires a technical assessment score of at least 80 percent', async () => {
      const candidate = {
        ...completeCandidate,
        assessments: [
          {
            ...completeCandidate.assessments[0],
            score: 11,
            maxScore: 15,
          },
        ],
      };
      prisma.candidate.findUnique.mockResolvedValue(candidate);

      const result = await service.getCandidateReadiness('candidate-1');

      expect(result.checks.technicalAssessment.complete).toBe(false);
      expect(result.allEvidenceComplete).toBe(false);
    });

    it('throws not found for an unknown candidate', async () => {
      prisma.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.getCandidateReadiness('missing-candidate'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getReadinessCandidates', () => {
    it('returns readiness summaries for all candidates', async () => {
      prisma.candidate.findMany.mockResolvedValue([
        { id: 'candidate-1' },
        { id: 'candidate-2' },
      ]);
      prisma.candidate.findUnique
        .mockResolvedValueOnce(completeCandidate)
        .mockResolvedValueOnce({
          ...completeCandidate,
          id: 'candidate-2',
          readinessReview: null,
        });

      const result = await service.getReadinessCandidates();

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items.map((item) => item.candidateId)).toEqual([
        'candidate-1',
        'candidate-2',
      ]);
      expect(prisma.candidate.findMany).toHaveBeenCalledWith({
        select: { id: true },
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('reviewCandidateReadiness', () => {
    it('rejects approval when evidence is incomplete', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        ...completeCandidate,
        expertMockInterviews: [],
      });

      await expect(
        service.reviewCandidateReadiness(
          'candidate-1',
          { decision: PlacementReadinessDecision.APPROVED },
          'reviewer-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.placementReadinessReview.upsert).not.toHaveBeenCalled();
    });

    it('persists human approval when all recorded evidence is complete', async () => {
      const savedReview = {
        id: 'review-1',
        candidateId: 'candidate-1',
        decision: PlacementReadinessDecision.APPROVED,
        approvedByUserId: 'reviewer-1',
        notes: 'Evidence verified by placement team',
      };
      prisma.candidate.findUnique.mockResolvedValue(completeCandidate);
      prisma.placementReadinessReview.upsert.mockResolvedValue(savedReview);

      const result = await service.reviewCandidateReadiness(
        'candidate-1',
        {
          decision: PlacementReadinessDecision.APPROVED,
          notes: ' Evidence verified by placement team ',
        },
        'reviewer-1',
      );

      expect(prisma.placementReadinessReview.upsert).toHaveBeenCalledWith({
        where: { candidateId: 'candidate-1' },
        create: expect.objectContaining({
          candidate: { connect: { id: 'candidate-1' } },
          decision: PlacementReadinessDecision.APPROVED,
          approvedByUserId: 'reviewer-1',
          notes: 'Evidence verified by placement team',
          reviewedAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          decision: PlacementReadinessDecision.APPROVED,
          approvedByUserId: 'reviewer-1',
          notes: 'Evidence verified by placement team',
          reviewedAt: expect.any(Date),
        }),
      });
      expect(result).toEqual({
        candidateId: 'candidate-1',
        review: savedReview,
        allEvidenceComplete: true,
      });
    });

    it.each([
      PlacementReadinessDecision.PENDING,
      PlacementReadinessDecision.NEEDS_WORK,
    ])('persists the %s decision without requiring complete evidence', async (decision) => {
      prisma.candidate.findUnique.mockResolvedValue({
        ...completeCandidate,
        expertMockInterviews: [],
      });
      prisma.placementReadinessReview.upsert.mockResolvedValue({
        candidateId: 'candidate-1',
        decision,
      });

      const result = await service.reviewCandidateReadiness(
        'candidate-1',
        { decision, notes: 'Follow-up required' },
        'reviewer-2',
      );

      expect(result.allEvidenceComplete).toBe(false);
      expect(prisma.placementReadinessReview.upsert).toHaveBeenCalledTimes(1);
    });

    it('rejects an invalid decision', async () => {
      prisma.candidate.findUnique.mockResolvedValue(completeCandidate);

      await expect(
        service.reviewCandidateReadiness(
          'candidate-1',
          { decision: 'INVALID' },
          'reviewer-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.placementReadinessReview.upsert).not.toHaveBeenCalled();
    });
  });
});

describe('PlacementController authorization', () => {
  const placementService = {
    overview: jest.fn(),
    listApplications: jest.fn(),
    getApplication: jest.fn(),
    createApplication: jest.fn(),
    updateApplication: jest.fn(),
    createInterview: jest.fn(),
    updateInterview: jest.fn(),
    createOffer: jest.fn(),
    updateOffer: jest.fn(),
    getReadinessCandidates: jest.fn(),
    getCandidateReadiness: jest.fn(),
    reviewCandidateReadiness: jest.fn(),
  };

  let controller: PlacementController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PlacementController(
      placementService as unknown as PlacementService,
    );
  });

  it.each(['ADMIN', 'SUPER_ADMIN', 'PLACEMENT_MANAGER'])(
    'allows %s to access placement overview',
    (role) => {
      const request = {
        user: {
          id: 'user-1',
          email: 'admin@example.test',
          name: 'Test Admin',
          role,
        },
      };

      controller.overview(request);

      expect(placementService.overview).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['STUDENT', 'INSTRUCTOR', 'MENTOR'])(
    'forbids %s from accessing placement overview',
    (role) => {
      const request = {
        user: {
          id: 'user-1',
          email: 'user@example.test',
          name: 'Test User',
          role,
        },
      };

      expect(() => controller.overview(request)).toThrow(ForbiddenException);
      expect(placementService.overview).not.toHaveBeenCalled();
    },
  );

  it('forbids a student from submitting a readiness review', () => {
    const request = {
      user: {
        id: 'student-1',
        email: 'student@example.test',
        name: 'Test Student',
        role: 'STUDENT',
      },
    };

    expect(() =>
      controller.reviewCandidateReadiness(
        request,
        'candidate-1',
        { decision: PlacementReadinessDecision.APPROVED },
      ),
    ).toThrow(ForbiddenException);

    expect(placementService.reviewCandidateReadiness).not.toHaveBeenCalled();
  });

  it('passes the authenticated reviewer ID to the readiness review service', () => {
    const request = {
      user: {
        id: 'reviewer-1',
        email: 'reviewer@example.test',
        name: 'Placement Reviewer',
        role: 'PLACEMENT_MANAGER',
      },
    };

    controller.reviewCandidateReadiness(
      request,
      'candidate-1',
      { decision: PlacementReadinessDecision.NEEDS_WORK },
    );

    expect(placementService.reviewCandidateReadiness).toHaveBeenCalledWith(
      'candidate-1',
      { decision: PlacementReadinessDecision.NEEDS_WORK },
      'reviewer-1',
    );
  });
});
