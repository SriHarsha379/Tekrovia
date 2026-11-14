import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { INTERACTIVE_QUESTIONS } from './interactive-assessment.questions';

type FactorResult = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
};

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  private classify(score: number): string {
    if (score >= 80) return 'PRO';
    if (score >= 60) return 'STARTER';
    return 'BEGINNER';
  }

  private scoreProfile(candidate: {
    education: string | null;
    graduationYear: number | null;
    experienceYears: number;
    skills: string[];
    targetRole: string | null;
    learningAvailability: string | null;
    careerGapMonths: number;
  }) {
    const skills = [
      ...new Set(candidate.skills.map((s) => s.trim()).filter(Boolean)),
    ];
    const factors: FactorResult[] = [];

    const skillsScore = Math.min(skills.length, 5) * 6;
    factors.push({
      key: 'skills',
      label: 'Skills profile',
      score: skillsScore,
      maxScore: 30,
      explanation:
        skills.length === 0
          ? 'Add your skills to make your profile more informative.'
          : `${skills.length} distinct skill(s) listed.`,
    });

    const experience = Math.max(0, candidate.experienceYears || 0);
    const experienceScore =
      experience === 0 ? 5 :
      experience < 1 ? 8 :
      experience < 3 ? 13 :
      experience < 5 ? 17 : 20;
    factors.push({
      key: 'experience',
      label: 'Experience profile',
      score: experienceScore,
      maxScore: 20,
      explanation:
        experience === 0
          ? 'No professional experience recorded.'
          : `${experience} year(s) of experience recorded.`,
    });

    const hasEducation = Boolean(candidate.education?.trim());
    const educationScore = hasEducation ? (candidate.graduationYear ? 15 : 10) : 0;
    factors.push({
      key: 'education',
      label: 'Education information',
      score: educationScore,
      maxScore: 15,
      explanation: hasEducation
        ? candidate.graduationYear
          ? 'Education and graduation year recorded.'
          : 'Education recorded; add graduation year to complete this section.'
        : 'Add education details.',
    });

    const hasTargetRole = Boolean(candidate.targetRole?.trim());
    factors.push({
      key: 'targetRole',
      label: 'Target-role clarity',
      score: hasTargetRole ? 20 : 0,
      maxScore: 20,
      explanation: hasTargetRole
        ? `Target role: ${candidate.targetRole!.trim()}.`
        : 'Choose a target role.',
    });

    const hasAvailability = Boolean(candidate.learningAvailability?.trim());
    factors.push({
      key: 'learningAvailability',
      label: 'Learning availability',
      score: hasAvailability ? 15 : 0,
      maxScore: 15,
      explanation: hasAvailability
        ? `Availability: ${candidate.learningAvailability!.trim()}.`
        : 'Add learning availability.',
    });

    const score = factors.reduce((t, f) => t + f.score, 0);
    const careerGapMonths = Math.max(0, candidate.careerGapMonths || 0);

    const nextSteps: string[] = [];
    if (skills.length < 3) nextSteps.push('Add at least three skills.');
    if (experience === 0) nextSteps.push('Build experience through guided projects or internships.');
    if (!hasEducation) nextSteps.push('Complete the education section.');
    if (!hasTargetRole) nextSteps.push('Select a target role.');
    if (!hasAvailability) nextSteps.push('Record your weekly learning availability.');
    if (careerGapMonths > 0)
      nextSteps.push('Discuss your career gap with a counsellor and plan a return-to-learning path.');
    if (nextSteps.length === 0) {
      nextSteps.push('Build a portfolio project demonstrating your target-role skills.');
      nextSteps.push('Use mock interviews to identify areas for further development.');
    }

    return {
      score,
      maxScore: 100,
      classification: this.classify(score),
      factors,
      nextSteps,
      context: {
        careerGapMonths,
        careerGapAffectsScore: false,
        scoreMeaning:
          'A profile-completeness estimate. It does not measure technical proficiency or placement likelihood.',
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INTERACTIVE ASSESSMENT
  // ─────────────────────────────────────────────────────────────
  async startInteractiveAssessment(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { id: true, targetRole: true },
    });

    if (!candidate) {
      throw new NotFoundException(
        'Complete your candidate profile before starting an assessment.',
      );
    }

    // ✅ Fix #9 — prevent duplicate IN_PROGRESS assessments
    const inProgress = await this.prisma.assessment.findFirst({
      where: {
        candidateId: candidate.id,
        type: AssessmentType.TECHNICAL,
        status: 'IN_PROGRESS',
      },
      select: { id: true },
    });

    if (inProgress) {
      throw new BadRequestException(
        'You already have an interactive assessment in progress. Submit or abandon it before starting a new one.',
      );
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        candidateId: candidate.id,
        createdByUserId: userId,
        type: AssessmentType.TECHNICAL,
        title: 'Interactive Career Skills Assessment',
        description:
          'A question-based assessment covering foundational full-stack development concepts.',
        status: 'IN_PROGRESS',
        maxScore: INTERACTIVE_QUESTIONS.length,
        responses: {
          rubricVersion: 'interactive-fullstack-v1',
          targetRole: candidate.targetRole ?? '',
          answers: [],
        },
      },
      select: { id: true, candidateId: true, status: true, startedAt: true },
    });

    return {
      assessment,
      totalQuestions: INTERACTIVE_QUESTIONS.length,
      questions: INTERACTIVE_QUESTIONS.map(({ id, category, prompt, options }) => ({
        id,
        category,
        prompt,
        options,
      })),
    };
  }

  async submitInteractiveAssessment(
    assessmentId: string,
    userId: string,
    submittedAnswers: unknown,
  ) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        candidate: { select: { id: true, userId: true, targetRole: true, skills: true } },
      },
    });

    if (!assessment || assessment.candidate.userId !== userId) {
      throw new NotFoundException('Assessment not found.');
    }

    if (assessment.type !== AssessmentType.TECHNICAL) {
      throw new BadRequestException('This is not an interactive technical assessment.');
    }

    if (assessment.status === 'COMPLETED' || assessment.status === 'REVIEWED') {
      throw new BadRequestException('This assessment has already been submitted.');
    }

    if (
      !Array.isArray(submittedAnswers) ||
      submittedAnswers.length !== INTERACTIVE_QUESTIONS.length
    ) {
      throw new BadRequestException(
        `Submit answers to all ${INTERACTIVE_QUESTIONS.length} questions.`,
      );
    }

    const answers = submittedAnswers as Array<{
      questionId?: unknown;
      answerIndex?: unknown;
    }>;
    const answerMap = new Map<string, number>();

    for (const answer of answers) {
      if (
        !answer ||
        typeof answer.questionId !== 'string' ||
        !Number.isInteger(answer.answerIndex) ||
        (answer.answerIndex as number) < 0
      ) {
        throw new BadRequestException(
          'Each answer must include a valid questionId and answerIndex.',
        );
      }
      if (answerMap.has(answer.questionId)) {
        throw new BadRequestException('Duplicate question answers are not allowed.');
      }
      answerMap.set(answer.questionId, answer.answerIndex as number);
    }

    if (INTERACTIVE_QUESTIONS.some((q) => !answerMap.has(q.id))) {
      throw new BadRequestException('One or more required questions are unanswered.');
    }

    for (const question of INTERACTIVE_QUESTIONS) {
      const selected = answerMap.get(question.id)!;
      if (selected >= question.options.length) {
        throw new BadRequestException(`Invalid answer option for ${question.id}.`);
      }
    }

    const results = INTERACTIVE_QUESTIONS.map((question) => {
      const selectedIndex = answerMap.get(question.id)!;
      return {
        questionId: question.id,
        category: question.category,
        selectedIndex,
        correct: selectedIndex === question.correctIndex,
        explanation: question.explanation,
      };
    });

    const correctCount = results.filter((r) => r.correct).length;
    const score = Math.round((correctCount / INTERACTIVE_QUESTIONS.length) * 100);
    const classification = score >= 80 ? 'PRO' : score >= 60 ? 'STARTER' : 'BEGINNER';

    const categoryResults = [
      ...new Set(INTERACTIVE_QUESTIONS.map((q) => q.category)),
    ].map((category) => {
      const group = results.filter((r) => r.category === category);
      const correct = group.filter((r) => r.correct).length;
      return {
        category,
        correct,
        total: group.length,
        percentage: Math.round((correct / group.length) * 100),
      };
    });

    const strengths = categoryResults
      .filter((r) => r.percentage >= 80)
      .map((r) => r.category);

    const improvementAreas = categoryResults
      .filter((r) => r.percentage < 80)
      .sort((a, b) => a.percentage - b.percentage);

    const recommendations = improvementAreas.length
      ? improvementAreas.map(
          (r) =>
            `Review ${r.category} fundamentals and complete a small hands-on exercise, then retake a practice quiz.`,
        )
      : [
          'Build and document a portfolio project that combines your skills.',
          'Practice explaining your technical decisions in a mock interview.',
        ];

    const responses = {
      rubricVersion: 'interactive-fullstack-v1',
      scoreMeaning:
        'This score reflects performance on these multiple-choice questions only.',
      correctCount,
      totalQuestions: INTERACTIVE_QUESTIONS.length,
      categoryResults,
      strengths,
      improvementAreas,
      answers: results,
    } satisfies Prisma.InputJsonObject;

    const roadmap = {
      summary: 'Use your question-level feedback to guide further study.',
      recommendations,
    } satisfies Prisma.InputJsonObject;

    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        score,
        maxScore: 100,
        classification,
        status: 'COMPLETED',
        responses,
        roadmap,
        completedAt: new Date(),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CAREER READINESS ASSESSMENT
  // ─────────────────────────────────────────────────────────────
  async createCareerReadinessAssessment(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException(
        'Complete your candidate profile before starting an assessment.',
      );
    }

    // ✅ Fix #9 — prevent duplicate CAREER_READINESS assessments
    const existing = await this.prisma.assessment.findFirst({
      where: {
        candidateId: candidate.id,
        type: AssessmentType.CAREER_READINESS,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });

    // Allow re-assessment only if the last one is older than 24 hours
    const REASSESSMENT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
    if (
      existing &&
      Date.now() - existing.createdAt.getTime() < REASSESSMENT_COOLDOWN_MS
    ) {
      throw new BadRequestException(
        'A career readiness assessment was already completed recently. Please wait 24 hours before re-assessing.',
      );
    }

    const result = this.scoreProfile(candidate);

    const responses = {
      rubricVersion: 'career-readiness-profile-v1',
      factors: result.factors,
      context: result.context,
      profileSnapshot: {
        education: candidate.education,
        graduationYear: candidate.graduationYear,
        experienceYears: candidate.experienceYears,
        skills: candidate.skills,
        targetRole: candidate.targetRole,
        learningAvailability: candidate.learningAvailability,
        careerGapMonths: candidate.careerGapMonths,
      },
    } satisfies Prisma.InputJsonObject;

    const roadmap = {
      summary:
        'Use this profile-based estimate to identify profile gaps and plan your next learning steps.',
      nextSteps: result.nextSteps,
    } satisfies Prisma.InputJsonObject;

    return this.prisma.assessment.create({
      data: {
        candidateId: candidate.id,
        type: AssessmentType.CAREER_READINESS,
        title: 'Career Readiness Profile Assessment',
        description:
          'A transparent estimate based on the completeness of your candidate profile.',
        score: result.score,
        maxScore: result.maxScore,
        classification: result.classification,
        status: 'COMPLETED',
        responses,
        roadmap,
        completedAt: new Date(),
      },
    });
  }

  async findForCandidate(candidateId: string, userId: string, isAdmin: boolean) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, userId: true },
    });

    if (!candidate) throw new NotFoundException('Candidate not found.');

    if (!isAdmin && candidate.userId !== userId) {
      throw new NotFoundException('Candidate not found.');
    }

    return this.prisma.assessment.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, isAdmin: boolean) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: { candidate: { select: { id: true, userId: true } } },
    });

    if (!assessment) throw new NotFoundException('Assessment not found.');

    if (!isAdmin && assessment.candidate.userId !== userId) {
      throw new NotFoundException('Assessment not found.');
    }

    return assessment;
  }

  async submitAssessment(assessmentId: string, _responses: Record<string, unknown>) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) throw new NotFoundException('Assessment not found.');

    throw new BadRequestException(
      'Profile-based assessments are calculated at creation and cannot accept client-submitted answers.',
    );
  }
}
