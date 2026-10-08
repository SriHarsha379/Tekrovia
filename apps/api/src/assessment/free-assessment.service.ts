import { Injectable } from '@nestjs/common';

export interface FreeAssessmentAnswer {
  questionId: string;
  selectedAnswer?: number;
  textAnswer?: string;
}

interface FreeQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  category: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
}

const FREE_QUESTIONS: FreeQuestion[] = [
  {
    id: 'q1',
    type: 'MULTIPLE_CHOICE',
    category: 'THEORY',
    question: 'What is the primary goal of learning a programming language?',
    options: [
      'To make your computer faster',
      'To communicate instructions to a computer in a structured way',
      'To replace human thinking',
      'To create video games only',
    ],
    correctAnswer: 1,
  },
  {
    id: 'q2',
    type: 'MULTIPLE_CHOICE',
    category: 'THEORY',
    question: 'Which of the following best describes an API?',
    options: [
      'A programming language',
      'A set of rules allowing software to communicate',
      'A type of database',
      'A web browser',
    ],
    correctAnswer: 1,
  },
  {
    id: 'q3',
    type: 'MULTIPLE_CHOICE',
    category: 'LOGIC',
    question:
      'Given the array [1,2,3,4,5], what is the result of filtering for even numbers?',
    options: ['[1,3,5]', '[2,4]', '[2,4,6]', '[]'],
    correctAnswer: 1,
  },
  {
    id: 'q4',
    type: 'MULTIPLE_CHOICE',
    category: 'LOGIC',
    question: 'In JavaScript, what does 2 + "2" evaluate to?',
    options: ['4', '"22"', '22', 'Error'],
    correctAnswer: 1,
  },
  {
    id: 'q5',
    type: 'SHORT_ANSWER',
    category: 'CODING',
    question: 'Write a function that returns the sum of two numbers.',
  },
];

const SCORABLE = FREE_QUESTIONS.filter(
  (question) => typeof question.correctAnswer === 'number',
);

@Injectable()
export class FreeAssessmentService {
  getQuestions() {
    return {
      id: 'free-assessment',
      title: 'Career Readiness Assessment',
      description:
        'Evaluate your current skill level and get a personalised learning roadmap.',
      totalQuestions: FREE_QUESTIONS.length,
      scoredQuestions: SCORABLE.length,
      estimatedTime: 15,
      questions: FREE_QUESTIONS.map((question) => ({
        id: question.id,
        type: question.type,
        category: question.category,
        question: question.question,
        options: question.options,
      })),
    };
  }

  score(answers: FreeAssessmentAnswer[]) {
    const submitted = Array.isArray(answers) ? answers : [];

    let correctAnswers = 0;

    for (const question of SCORABLE) {
      const answer = submitted.find(
        (item) => item?.questionId === question.id,
      );

      if (answer && answer.selectedAnswer === question.correctAnswer) {
        correctAnswers += 1;
      }
    }

    const percentage = Math.round(
      (correctAnswers / SCORABLE.length) * 100,
    );

    return {
      correctAnswers,
      scoredQuestions: SCORABLE.length,
      percentage,
      readinessLevel: this.readinessLevel(percentage),
      feedback: this.feedback(percentage),
      roadmap: this.roadmap(percentage),
      nextSteps: [
        'Explore the recommended learning track',
        'Book a free counselling call',
        'Create an account to track your progress',
      ],
      disclaimer:
        'This is an indicative self-assessment. A full career-readiness review is available after registration.',
    };
  }

  private readinessLevel(percentage: number): string {
    if (percentage >= 80) return 'Job Ready';
    if (percentage >= 60) return 'Targeted Brush-up';
    return 'Foundational Learning';
  }

  private feedback(percentage: number): string {
    if (percentage >= 80) {
      return 'Strong fundamentals. Focus next on projects and interview practice.';
    }
    if (percentage >= 60) {
      return 'Good grounding, with a few areas worth revisiting before you apply.';
    }
    return 'A solid starting point. Building the fundamentals first will pay off quickly.';
  }

  private roadmap(percentage: number) {
    const phases = [
      {
        phase: 1,
        title: 'Foundation Basics',
        courses: ['JavaScript Fundamentals', 'Web Development Basics'],
        duration: '4 weeks',
      },
      {
        phase: 2,
        title: 'Advanced Concepts',
        courses: ['React Mastery', 'Node.js Backend'],
        duration: '6 weeks',
      },
      {
        phase: 3,
        title: 'Project Building',
        courses: ['Full Stack Projects', 'System Design'],
        duration: '4 weeks',
      },
    ];

    return percentage >= 80 ? phases.slice(1) : phases;
  }
}
