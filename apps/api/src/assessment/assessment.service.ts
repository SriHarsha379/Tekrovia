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
    const skills = [...new Set(
      candidate.skills
        .map((skill) => skill.trim())
        .filter(Boolean),
    )];

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
          : `${skills.length} distinct skill(s) listed. This measures profile coverage, not skill proficiency.`,
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
          ? 'Your profile indicates you are at the beginning of your professional experience.'
          : `${experience} year(s) of experience recorded. This factor reflects profile context, not work quality.`,
    });

    const hasEducation = Boolean(candidate.education?.trim());
    const educationScore = hasEducation
      ? candidate.graduationYear
        ? 15
        : 10
      : 0;

    factors.push({
      key: 'education',
      label: 'Education information',
      score: educationScore,
      maxScore: 15,
      explanation: hasEducation
        ? candidate.graduationYear
          ? 'Education and graduation year are recorded.'
          : 'Education is recorded; adding a graduation year would complete this profile section.'
        : 'Add your education details to complete this profile section.',
    });

    const hasTargetRole = Boolean(candidate.targetRole?.trim());
    factors.push({
      key: 'targetRole',
      label: 'Target-role clarity',
      score: hasTargetRole ? 20 : 0,
      maxScore: 20,
      explanation: hasTargetRole
        ? `Target role recorded: ${candidate.targetRole!.trim()}.`
        : 'Choose a target role to help tailor your learning and career plan.',
    });

    const hasAvailability = Boolean(
      candidate.learningAvailability?.trim(),
    );
    factors.push({
      key: 'learningAvailability',
      label: 'Learning availability',
      score: hasAvailability ? 15 : 0,
      maxScore: 15,
      explanation: hasAvailability
        ? `Learning availability recorded: ${candidate.learningAvailability!.trim()}.`
        : 'Add your learning availability to help create a realistic development plan.',
    });

    const score = factors.reduce((total, factor) => total + factor.score, 0);
    const careerGapMonths = Math.max(0, candidate.careerGapMonths || 0);

    const nextSteps: string[] = [];

    if (skills.length < 3) {
      nextSteps.push('Add at least three skills to your profile.');
    }
    if (experience === 0) {
      nextSteps.push(
        'Build practical experience through guided projects, labs, or internships.',
      );
    }
    if (!hasEducation) {
      nextSteps.push('Complete the education section of your profile.');
    }
    if (!hasTargetRole) {
      nextSteps.push('Select a target role to focus your learning plan.');
    }
    if (!hasAvailability) {
      nextSteps.push('Record your weekly learning availability.');
    }
    if (careerGapMonths > 0) {
      nextSteps.push(
        'If useful, discuss your career-gap context with a counsellor and plan a manageable return-to-learning path.',
      );
    }
    if (nextSteps.length === 0) {
      nextSteps.push(
        'Review your target-role skills and build a portfolio project demonstrating them.',
      );
      nextSteps.push(
        'Use mock interviews and feedback to identify areas for further development.',
      );
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
          'A profile-completeness and planning estimate. It does not measure technical proficiency, employability, or likelihood of placement.',
      },
    };
  }


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

    const assessment = await this.prisma.assessment.create({
      data: {
        candidateId: candidate.id,
        createdByUserId: userId,
        type: AssessmentType.TECHNICAL,
        title: 'Interactive Career Skills Assessment',
        description: 'A question-based assessment covering foundational full-stack development concepts.',
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
      questions: INTERACTIVE_QUESTIONS.map(
        ({ id, category, prompt, options }) => ({
          id,
          category,
          prompt,
          options,
        }),
      ),
    };
  }

  async submitInteractiveAssessment(
    assessmentId: string,
    userId: string,
    submittedAnswers: unknown,
  ) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { candidate: { select: { id: true, userId: true, targetRole: true, skills: true } } },
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

    if (!Array.isArray(submittedAnswers) || submittedAnswers.length !== INTERACTIVE_QUESTIONS.length) {
      throw new BadRequestException(`Submit answers to all ${INTERACTIVE_QUESTIONS.length} questions.`);
    }

    const answers = submittedAnswers as Array<{ questionId?: unknown; answerIndex?: unknown }>;
    const answerMap = new Map<string, number>();

    for (const answer of answers) {
      if (
        !answer ||
        typeof answer.questionId !== 'string' ||
        !Number.isInteger(answer.answerIndex) ||
        (answer.answerIndex as number) < 0
      ) {
        throw new BadRequestException('Each answer must include a valid questionId and answerIndex.');
      }

      if (answerMap.has(answer.questionId)) {
        throw new BadRequestException('Duplicate question answers are not allowed.');
      }

      answerMap.set(answer.questionId, answer.answerIndex as number);
    }

    if (INTERACTIVE_QUESTIONS.some((question) => !answerMap.has(question.id))) {
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

    const correctCount = results.filter((item) => item.correct).length;
    const score = Math.round((correctCount / INTERACTIVE_QUESTIONS.length) * 100);
    const classification =
      score >= 80 ? 'PRO' : score >= 60 ? 'STARTER' : 'BEGINNER';

    const categoryResults = [...new Set(INTERACTIVE_QUESTIONS.map((q) => q.category))].map((category) => {
      const group = results.filter((item) => item.category === category);
      const correct = group.filter((item) => item.correct).length;
      return {
        category,
        correct,
        total: group.length,
        percentage: Math.round((correct / group.length) * 100),
      };
    });

    const strengths = categoryResults
      .filter((item) => item.percentage >= 80)
      .map((item) => item.category);

    const improvementAreas = categoryResults
      .filter((item) => item.percentage < 80)
      .sort((a, b) => a.percentage - b.percentage);

    const recommendations = improvementAreas.length
      ? improvementAreas.map((item) =>
          `Review ${item.category} fundamentals and complete a small hands-on exercise, then retake a practice quiz.`,
        )
      : [
          'Build and document a portfolio project that combines your skills.',
          'Practice explaining your technical decisions in a mock interview.',
          'Try a more advanced, role-specific assessment to identify deeper learning goals.',
        ];

    const responses = {
      rubricVersion: 'interactive-fullstack-v1',
      scoreMeaning: 'This score reflects performance on these multiple-choice questions only; it is not a validated measure of employability or placement likelihood.',
      correctCount,
      totalQuestions: INTERACTIVE_QUESTIONS.length,
      categoryResults,
      strengths,
      improvementAreas,
      answers: results,
    } satisfies Prisma.InputJsonObject;

    const roadmap = {
      summary: 'Use your question-level feedback to guide further study and practical work.',
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

  async createCareerReadinessAssessment(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException(
        'Complete your candidate profile before starting an assessment.',
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

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

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
      include: {
        candidate: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    if (!isAdmin && assessment.candidate.userId !== userId) {
      throw new NotFoundException('Assessment not found.');
    }

    return assessment;
  }

  async submitAssessment(
    assessmentId: string,
    _responses: Record<string, unknown>,
  ) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    throw new BadRequestException(
      'Profile-based career readiness assessments are calculated when created and cannot accept client-submitted scores or answers.',
    );
  }
}
