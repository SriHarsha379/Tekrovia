import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssessmentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { INTERACTIVE_QUESTIONS } from './interactive-assessment.questions';
import { AssessmentService } from './assessment.service';

describe('AssessmentService', () => {
  let service: AssessmentService;

  const prisma = {
    candidate: {
      findUnique: jest.fn(),
    },
    assessment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const candidate = {
    id: 'candidate-1',
    userId: 'user-1',
    fullName: 'Test Student',
    email: 'student@example.test',
    phone: '9000000000',
    education: 'B.Tech',
    graduationYear: 2024,
    experienceYears: 2,
    skills: ['TypeScript', ' React ', 'Node.js', 'TypeScript'],
    targetRole: 'Full Stack Developer',
    learningAvailability: 'Weekends',
    careerGapMonths: 6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssessmentService(prisma as unknown as PrismaService);
  });

  describe('createCareerReadinessAssessment', () => {
    it('calculates a profile-based score and persists a completed assessment', async () => {
      const saved = { id: 'assessment-1', candidateId: candidate.id };
      prisma.candidate.findUnique.mockResolvedValue(candidate);
      prisma.assessment.create.mockResolvedValue(saved);

      const result = await service.createCareerReadinessAssessment('user-1');

      expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });

      expect(prisma.assessment.create).toHaveBeenCalledTimes(1);
      const createArg = prisma.assessment.create.mock.calls[0][0];

      expect(createArg.data).toMatchObject({
        candidateId: candidate.id,
        type: AssessmentType.CAREER_READINESS,
        title: 'Career Readiness Profile Assessment',
        score: 81,
        maxScore: 100,
        classification: 'PRO',
        status: 'COMPLETED',
      });
      expect(createArg.data.completedAt).toBeInstanceOf(Date);
      expect(createArg.data.responses.rubricVersion).toBe(
        'career-readiness-profile-v1',
      );
      expect(createArg.data.responses.context).toMatchObject({
        careerGapMonths: 6,
        careerGapAffectsScore: false,
      });
      expect(createArg.data.responses.factors).toHaveLength(5);
      expect(createArg.data.roadmap.nextSteps).toContain(
        'If useful, discuss your career-gap context with a counsellor and plan a manageable return-to-learning path.',
      );
      expect(result).toEqual(saved);
    });

    it('does not penalize a career gap in the profile score', async () => {
      const noGap = { ...candidate, careerGapMonths: 0 };
      const longGap = { ...candidate, careerGapMonths: 48 };
      prisma.candidate.findUnique
        .mockResolvedValueOnce(noGap)
        .mockResolvedValueOnce(longGap);
      prisma.assessment.create
        .mockResolvedValueOnce({ id: 'a1' })
        .mockResolvedValueOnce({ id: 'a2' });

      await service.createCareerReadinessAssessment('user-1');
      await service.createCareerReadinessAssessment('user-1');

      const first = prisma.assessment.create.mock.calls[0][0].data;
      const second = prisma.assessment.create.mock.calls[1][0].data;

      expect(first.score).toBe(second.score);
      expect(first.responses.context.careerGapAffectsScore).toBe(false);
      expect(second.responses.context.careerGapMonths).toBe(48);
    });

    it('deduplicates and trims skills before scoring', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        ...candidate,
        skills: [' Python ', 'Python', '', ' SQL ', 'React'],
      });
      prisma.assessment.create.mockResolvedValue({ id: 'a1' });

      await service.createCareerReadinessAssessment('user-1');

      const data = prisma.assessment.create.mock.calls[0][0].data;
      const skillsFactor = data.responses.factors.find(
        (factor: { key: string }) => factor.key === 'skills',
      );

      expect(skillsFactor.score).toBe(18);
      expect(skillsFactor.explanation).toContain('3 distinct skill(s)');
      expect(data.responses.profileSnapshot.skills).toEqual([
        ' Python ',
        'Python',
        '',
        ' SQL ',
        'React',
      ]);
    });

    it('caps skills points at 30', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        ...candidate,
        skills: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      });
      prisma.assessment.create.mockResolvedValue({ id: 'a1' });

      await service.createCareerReadinessAssessment('user-1');

      const data = prisma.assessment.create.mock.calls[0][0].data;
      const factor = data.responses.factors.find(
        (item: { key: string }) => item.key === 'skills',
      );

      expect(factor.score).toBe(30);
    });

    it('returns not found when the student has no candidate profile', async () => {
      prisma.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.createCareerReadinessAssessment('user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.assessment.create).not.toHaveBeenCalled();
    });

    it('propagates database errors instead of pretending the assessment was saved', async () => {
      prisma.candidate.findUnique.mockResolvedValue(candidate);
      prisma.assessment.create.mockRejectedValue(new Error('database down'));

      await expect(
        service.createCareerReadinessAssessment('user-1'),
      ).rejects.toThrow('database down');
    });
  });

  describe('startInteractiveAssessment', () => {
    it('creates an in-progress technical assessment and returns question data', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        id: candidate.id,
        targetRole: candidate.targetRole,
      });
      prisma.assessment.create.mockResolvedValue({
        id: 'technical-1',
        candidateId: candidate.id,
        status: 'IN_PROGRESS',
        startedAt: new Date('2026-09-30T10:00:00.000Z'),
      });

      const result = await service.startInteractiveAssessment('user-1');

      expect(prisma.assessment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            candidateId: candidate.id,
            createdByUserId: 'user-1',
            type: AssessmentType.TECHNICAL,
            status: 'IN_PROGRESS',
            maxScore: INTERACTIVE_QUESTIONS.length,
          }),
        }),
      );
      expect(result.totalQuestions).toBe(INTERACTIVE_QUESTIONS.length);
      expect(result.questions).toHaveLength(INTERACTIVE_QUESTIONS.length);
      expect(result.questions[0]).toEqual(
        expect.objectContaining({
          id: INTERACTIVE_QUESTIONS[0].id,
          category: INTERACTIVE_QUESTIONS[0].category,
          prompt: INTERACTIVE_QUESTIONS[0].prompt,
          options: INTERACTIVE_QUESTIONS[0].options,
        }),
      );
      expect(result.questions[0]).not.toHaveProperty('correctIndex');
      expect(result.questions[0]).not.toHaveProperty('explanation');
    });

    it('rejects starting when no candidate profile exists', async () => {
      prisma.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.startInteractiveAssessment('user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.assessment.create).not.toHaveBeenCalled();
    });
  });

  describe('submitInteractiveAssessment', () => {
    const inProgressAssessment = {
      id: 'technical-1',
      candidateId: candidate.id,
      type: AssessmentType.TECHNICAL,
      status: 'IN_PROGRESS',
      candidate: {
        id: candidate.id,
        userId: 'user-1',
        targetRole: candidate.targetRole,
        skills: candidate.skills,
      },
    };

    const allCorrectAnswers = () =>
      INTERACTIVE_QUESTIONS.map((question) => ({
        questionId: question.id,
        answerIndex: question.correctIndex,
      }));

    beforeEach(() => {
      prisma.assessment.findUnique.mockResolvedValue(inProgressAssessment);
      prisma.assessment.update.mockResolvedValue({
        id: 'technical-1',
        status: 'COMPLETED',
        score: 100,
      });
    });

    it('scores a fully correct submission and persists the completed result', async () => {
      const result = await service.submitInteractiveAssessment(
        'technical-1',
        'user-1',
        allCorrectAnswers(),
      );

      expect(prisma.assessment.update).toHaveBeenCalledTimes(1);
      const updateArg = prisma.assessment.update.mock.calls[0][0];

      expect(updateArg.where).toEqual({ id: 'technical-1' });
      expect(updateArg.data).toMatchObject({
        score: 100,
        maxScore: 100,
        classification: 'PRO',
        status: 'COMPLETED',
      });
      expect(updateArg.data.completedAt).toBeInstanceOf(Date);
      expect(updateArg.data.responses.correctCount).toBe(
        INTERACTIVE_QUESTIONS.length,
      );
      expect(updateArg.data.responses.totalQuestions).toBe(
        INTERACTIVE_QUESTIONS.length,
      );
      expect(updateArg.data.responses.answers).toHaveLength(
        INTERACTIVE_QUESTIONS.length,
      );
      expect(result).toEqual({
        id: 'technical-1',
        status: 'COMPLETED',
        score: 100,
      });
    });

    it('scores zero correctly and classifies the result as BEGINNER', async () => {
      const allWrongAnswers = INTERACTIVE_QUESTIONS.map((question) => ({
        questionId: question.id,
        answerIndex: (question.correctIndex + 1) % question.options.length,
      }));

      await service.submitInteractiveAssessment(
        'technical-1',
        'user-1',
        allWrongAnswers,
      );

      const data = prisma.assessment.update.mock.calls[0][0].data;
      expect(data.score).toBe(0);
      expect(data.classification).toBe('BEGINNER');
      expect(data.responses.correctCount).toBe(0);
    });

    it('rejects an assessment belonging to another user', async () => {
      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'different-user',
          allCorrectAnswers(),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('returns not found for an unknown assessment', async () => {
      prisma.assessment.findUnique.mockResolvedValue(null);

      await expect(
        service.submitInteractiveAssessment(
          'missing',
          'user-1',
          allCorrectAnswers(),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('rejects a non-technical assessment', async () => {
      prisma.assessment.findUnique.mockResolvedValue({
        ...inProgressAssessment,
        type: AssessmentType.CAREER_READINESS,
      });

      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'user-1',
          allCorrectAnswers(),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it.each(['COMPLETED', 'REVIEWED'])(
      'rejects resubmission when status is %s',
      async (status) => {
        prisma.assessment.findUnique.mockResolvedValue({
          ...inProgressAssessment,
          status,
        });

        await expect(
          service.submitInteractiveAssessment(
            'technical-1',
            'user-1',
            allCorrectAnswers(),
          ),
        ).rejects.toThrow('This assessment has already been submitted.');

        expect(prisma.assessment.update).not.toHaveBeenCalled();
      },
    );

    it('rejects a non-array answer payload', async () => {
      await expect(
        service.submitInteractiveAssessment('technical-1', 'user-1', null),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an incomplete answer list', async () => {
      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'user-1',
          allCorrectAnswers().slice(1),
        ),
      ).rejects.toThrow(
        `Submit answers to all ${INTERACTIVE_QUESTIONS.length} questions.`,
      );

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('rejects malformed answer objects and negative indexes', async () => {
      const malformed = allCorrectAnswers();
      malformed[0] = { questionId: '', answerIndex: -1 };

      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'user-1',
          malformed,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('rejects duplicate question answers', async () => {
      const answers = allCorrectAnswers();
      answers[1] = { ...answers[0] };

      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'user-1',
          answers,
        ),
      ).rejects.toThrow('Duplicate question answers are not allowed.');

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('rejects an out-of-range option index', async () => {
      const answers = allCorrectAnswers();
      answers[0] = {
        questionId: INTERACTIVE_QUESTIONS[0].id,
        answerIndex: INTERACTIVE_QUESTIONS[0].options.length,
      };

      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'user-1',
          answers,
        ),
      ).rejects.toThrow(
        `Invalid answer option for ${INTERACTIVE_QUESTIONS[0].id}.`,
      );

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('rejects a missing required question even if the payload length matches', async () => {
      const answers = allCorrectAnswers();
      answers[0] = {
        questionId: 'unknown-question-id',
        answerIndex: 0,
      };

      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'user-1',
          answers,
        ),
      ).rejects.toThrow('One or more required questions are unanswered.');

      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('propagates persistence errors on submission', async () => {
      prisma.assessment.update.mockRejectedValue(
        new Error('write failed'),
      );

      await expect(
        service.submitInteractiveAssessment(
          'technical-1',
          'user-1',
          allCorrectAnswers(),
        ),
      ).rejects.toThrow('write failed');
    });
  });

  describe('findForCandidate', () => {
    const history = [
      { id: 'newest', createdAt: new Date('2026-09-30T12:00:00Z') },
      { id: 'older', createdAt: new Date('2026-09-29T12:00:00Z') },
    ];

    it('returns the candidate assessment history in descending date order', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        id: candidate.id,
        userId: 'user-1',
      });
      prisma.assessment.findMany.mockResolvedValue(history);

      const result = await service.findForCandidate(
        candidate.id,
        'user-1',
        false,
      );

      expect(prisma.assessment.findMany).toHaveBeenCalledWith({
        where: { candidateId: candidate.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(history);
    });

    it('returns an empty list when the candidate has no assessments', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        id: candidate.id,
        userId: 'user-1',
      });
      prisma.assessment.findMany.mockResolvedValue([]);

      await expect(
        service.findForCandidate(candidate.id, 'user-1', false),
      ).resolves.toEqual([]);
    });

    it('does not expose another candidate history to a student', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        id: candidate.id,
        userId: 'someone-else',
      });

      await expect(
        service.findForCandidate(candidate.id, 'user-1', false),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.assessment.findMany).not.toHaveBeenCalled();
    });

    it('allows an admin to view another candidate history', async () => {
      prisma.candidate.findUnique.mockResolvedValue({
        id: candidate.id,
        userId: 'someone-else',
      });
      prisma.assessment.findMany.mockResolvedValue(history);

      await expect(
        service.findForCandidate(candidate.id, 'admin-user', true),
      ).resolves.toEqual(history);
    });

    it('returns not found for an unknown candidate', async () => {
      prisma.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.findForCandidate('missing', 'user-1', false),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.assessment.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const assessment = {
      id: 'assessment-1',
      candidate: { id: candidate.id, userId: 'user-1' },
    };

    it('allows the owning student to retrieve an assessment', async () => {
      prisma.assessment.findUnique.mockResolvedValue(assessment);

      await expect(
        service.findOne('assessment-1', 'user-1', false),
      ).resolves.toEqual(assessment);
    });

    it('hides another student assessment from the requester', async () => {
      prisma.assessment.findUnique.mockResolvedValue({
        ...assessment,
        candidate: { ...assessment.candidate, userId: 'someone-else' },
      });

      await expect(
        service.findOne('assessment-1', 'user-1', false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows an admin to retrieve another student assessment', async () => {
      prisma.assessment.findUnique.mockResolvedValue({
        ...assessment,
        candidate: { ...assessment.candidate, userId: 'someone-else' },
      });

      await expect(
        service.findOne('assessment-1', 'admin-user', true),
      ).resolves.toMatchObject({ id: 'assessment-1' });
    });

    it('returns not found for an unknown assessment', async () => {
      prisma.assessment.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('missing', 'user-1', false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
