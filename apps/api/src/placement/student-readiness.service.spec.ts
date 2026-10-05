import {
  AssessmentStatus,
  AssessmentType,
  CandidateProjectStatus,
  ExpertMockInterviewStatus,
  PlacementReadinessDecision,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlacementService } from './placement.service';

describe('PlacementService.getStudentReadiness', () => {
  const prisma = {
    candidate: { findUnique: jest.fn() },
  };

  let service: PlacementService;

  const fullCandidate = (overrides: Record<string, unknown> = {}) => ({
    id: 'cand-1',
    fullName: 'Asha Rao',
    email: 'asha@example.test',
    phone: '9876543210',
    education: 'B.Tech',
    graduationYear: 2024,
    skills: ['Python'],
    targetRole: 'Backend',
    resumeUrl: 'https://example.test/cv',
    learningAvailability: '2 hours',
    preferredSchedule: 'Evenings',
    courseInterest: 'Python',
    assessments: [
      {
        type: AssessmentType.TECHNICAL,
        status: AssessmentStatus.COMPLETED,
        score: 9,
        maxScore: 10,
        responses: { rubricVersion: 'interactive-fullstack-v1' },
      },
    ],
    expertMockInterviews: [1, 2, 3].map((sequence) => ({
      sequence,
      isFinal: sequence === 3,
      status: ExpertMockInterviewStatus.COMPLETED,
      score: 9,
      maxScore: 10,
      reviewerName: 'Secret Reviewer',
      feedback: 'Private mentor feedback',
    })),
    projectReviews: [
      {
        id: 'proj-1',
        projectName: 'Build an API',
        status: CandidateProjectStatus.APPROVED,
        expertApproved: true,
        reviewerName: 'Secret Reviewer',
        mentorFeedback: 'Private mentor feedback',
      },
    ],
    readinessReview: {
      decision: PlacementReadinessDecision.PENDING,
      notes: 'Private reviewer notes',
      approvedByUserId: 'admin-1',
    },
    ...overrides,
  });

  beforeEach(() => {
    service = new PlacementService(prisma as unknown as PrismaService);
  });

  it('looks the candidate up by user and reports an incomplete profile when there is none', async () => {
    prisma.candidate.findUnique.mockResolvedValueOnce(null);

    const result = await service.getStudentReadiness('user-1');

    expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { id: true },
    });
    expect(result).toEqual({ profileComplete: false });
    expect(prisma.candidate.findUnique).toHaveBeenCalledTimes(1);
  });

  describe('with a candidate profile', () => {
    async function run(candidate = fullCandidate()) {
      prisma.candidate.findUnique
        .mockResolvedValueOnce({ id: 'cand-1' })
        .mockResolvedValueOnce(candidate);
      return service.getStudentReadiness('user-1');
    }

    it('reports each check using the same rules as the staff gate', async () => {
      const result = await run();

      expect(result).toMatchObject({
        profileComplete: true,
        allEvidenceComplete: true,
        checks: {
          expertMocks: { complete: true, completedCount: 3, requiredCount: 3 },
          finalExpertMock: { complete: true, score: 9, maxScore: 10, requiredScore: 8 },
          expertApprovedProject: { complete: true, approvedCount: 1 },
          technicalAssessment: { complete: true, score: 9, maxScore: 10 },
        },
        decision: PlacementReadinessDecision.PENDING,
        approvalRequiresHumanReview: true,
      });
    });

    it('shows what is still missing', async () => {
      const result = await run(
        fullCandidate({
          expertMockInterviews: [],
          projectReviews: [],
          assessments: [],
        }),
      );

      expect(result).toMatchObject({
        allEvidenceComplete: false,
        checks: {
          expertMocks: { complete: false, completedCount: 0 },
          finalExpertMock: { complete: false, score: null },
          expertApprovedProject: { complete: false, approvedCount: 0 },
          technicalAssessment: { complete: false, score: null },
        },
      });
    });

    it('never leaks reviewer names, feedback, notes or contact details', async () => {
      const result = await run();
      const text = JSON.stringify(result);

      expect(text).not.toContain('Secret Reviewer');
      expect(text).not.toContain('Private mentor feedback');
      expect(text).not.toContain('Private reviewer notes');
      expect(text).not.toContain('asha@example.test');
      expect(text).not.toContain('9876543210');
      expect(text).not.toContain('admin-1');
      expect(text).not.toContain('Build an API');
    });

    it('exposes only the expected top-level and check fields', async () => {
      const result = (await run()) as Record<string, unknown>;

      expect(Object.keys(result).sort()).toEqual([
        'allEvidenceComplete',
        'approvalRequiresHumanReview',
        'checks',
        'decision',
        'profileComplete',
      ]);
      expect(Object.keys(result.checks as object).sort()).toEqual([
        'expertApprovedProject',
        'expertMocks',
        'finalExpertMock',
        'technicalAssessment',
      ]);
    });

    it('reports a pending decision when no human review has happened', async () => {
      const result = await run(fullCandidate({ readinessReview: null }));

      expect(result).toMatchObject({ decision: PlacementReadinessDecision.PENDING });
    });

    it('passes a recorded human decision through, but only the decision', async () => {
      const result = await run(
        fullCandidate({
          readinessReview: {
            decision: PlacementReadinessDecision.NEEDS_WORK,
            notes: 'Private reviewer notes',
            approvedByUserId: 'admin-1',
          },
        }),
      );

      expect(result).toMatchObject({ decision: PlacementReadinessDecision.NEEDS_WORK });
      expect(JSON.stringify(result)).not.toContain('Private reviewer notes');
    });

    it('does not count a legacy technical assessment as the formal one', async () => {
      const result = await run(
        fullCandidate({
          assessments: [
            {
              type: AssessmentType.TECHNICAL,
              status: AssessmentStatus.COMPLETED,
              score: 10,
              maxScore: 10,
              responses: { rubricVersion: 'legacy' },
            },
          ],
        }),
      );

      expect(result).toMatchObject({
        checks: { technicalAssessment: { complete: false } },
      });
    });

    it('never claims readiness when evidence is complete but no human has approved', async () => {
      const result = await run();

      expect(result).toMatchObject({
        allEvidenceComplete: true,
        decision: PlacementReadinessDecision.PENDING,
        approvalRequiresHumanReview: true,
      });
    });
  });
});
