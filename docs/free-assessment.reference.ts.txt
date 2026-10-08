import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateAssessmentDto {
  title?: string;
  type?: string;
}

interface SubmitAssessmentDto {
  assessmentId: string;
  answers: {
    questionId: string;
    selectedAnswer?: number;
    textAnswer?: string;
  }[];
}

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  private freeAssessmentQuestions = [
    {
      id: 'q1',
      type: 'MULTIPLE_CHOICE',
      category: 'THEORY',
      question: 'What is the primary goal of learning a programming language?',
      options: [
        'To make your computer faster',
        'To communicate instructions to a computer in a structured way',
        'To replace human thinking',
        'To create video games only'
      ],
      correctAnswer: 1
    },
    {
      id: 'q2',
      type: 'MULTIPLE_CHOICE',
      category: 'THEORY',
      question: 'Which of the following best describes "API"?',
      options: [
        'A programming language',
        'A set of rules allowing software to communicate',
        'A type of database',
        'A web browser'
      ],
      correctAnswer: 1
    },
    {
      id: 'q3',
      type: 'MULTIPLE_CHOICE',
      category: 'LOGIC',
      question: 'If you have an array [1,2,3,4,5], what is the result of filtering even numbers?',
      options: [
        '[1,3,5]',
        '[2,4]',
        '[2,4,6]',
        '[]'
      ],
      correctAnswer: 1
    },
    {
      id: 'q4',
      type: 'MULTIPLE_CHOICE',
      category: 'LOGIC',
      question: 'What will this code return? 2 + "2"',
      options: [
        '4',
        '"22"',
        '22',
        'Error'
      ],
      correctAnswer: 1
    },
    {
      id: 'q5',
      type: 'SHORT_ANSWER',
      category: 'CODING',
      question: 'Write a function that returns the sum of two numbers.',
      sample: 'function add(a, b) { return a + b; }'
    }
  ];

  getFreeAssessment() {
    return {
      id: 'free-assessment',
      title: 'Career Readiness Assessment',
      description: 'Evaluate your current skill level and get personalized recommendations',
      totalQuestions: this.freeAssessmentQuestions.length,
      estimatedTime: 15,
      questions: this.freeAssessmentQuestions.map((q: any) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options || undefined,
        category: q.category
      }))
    };
  }

  scoreFreeAssessment(dto: SubmitAssessmentDto) {
    let correctAnswers = 0;

    (dto.answers || []).forEach((answer: any) => {
      const question = this.freeAssessmentQuestions.find(
        (q) => q.id === answer.questionId,
      );
      if (question && (question as any).correctAnswer === answer.selectedAnswer) {
        correctAnswers++;
      }
    });

    const score = correctAnswers * 20;

    return {
      score,
      totalQuestions: this.freeAssessmentQuestions.length,
      correctAnswers,
      percentage: Math.round(
        (correctAnswers / this.freeAssessmentQuestions.length) * 100,
      ),
      feedback: this.generateFeedback(score),
      readinessLevel: this.getReadinessLevel(score),
      roadmap: this.generateRoadmap(score),
      nextSteps: [
        'Enroll in recommended course',
        'Schedule free trial',
        'Talk to counselor',
      ],
    };
  }

  async startAssessment(userId: string, dto: CreateAssessmentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { candidate: true }
    });

    const assessment = await this.prisma.assessment.create({
      data: {
        title: dto.title || 'Free Assessment',
        type: 'FREE_ASSESSMENT',
        candidateId: user?.candidate?.id,
        status: 'IN_PROGRESS'
      }
    });

    return {
      assessmentId: assessment.id,
      startedAt: assessment.createdAt,
      questions: this.freeAssessmentQuestions
    };
  }

  async getResult(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId }
    });

    return {
      assessmentId: assessment?.id,
      score: assessment?.score,
      feedback: assessment?.feedback,
      completedAt: assessment?.completedAt,
      readinessLevel: this.getReadinessLevel(assessment?.score || 0)
    };
  }

  private generateFeedback(score: number): string {
    if (score >= 80) return 'Excellent! You have strong foundational knowledge.';
    if (score >= 60) return 'Good progress! Some areas need more practice.';
    return 'Great opportunity to strengthen your fundamentals.';
  }

  private getReadinessLevel(score: number): string {
    if (score >= 80) return 'Job Ready';
    if (score >= 60) return 'Targeted Brush-up';
    return 'Foundational Learning';
  }

  private generateRoadmap(score: number) {
    const baseRoadmap = [
      {
        phase: 1,
        title: 'Foundation Basics',
        courses: ['JavaScript Fundamentals', 'Web Dev Basics'],
        duration: '4 weeks'
      },
      {
        phase: 2,
        title: 'Advanced Concepts',
        courses: ['React Mastery', 'Node.js Backend'],
        duration: '6 weeks'
      },
      {
        phase: 3,
        title: 'Project Building',
        courses: ['Full Stack Projects', 'System Design'],
        duration: '4 weeks'
      }
    ];

    if (score >= 80) return baseRoadmap.slice(1);
    return baseRoadmap;
  }
}
