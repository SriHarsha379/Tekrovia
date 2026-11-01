import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly secret: string;

  constructor(private config: ConfigService) {
    this.baseUrl = config.get('AI_SERVICE_URL') ?? 'http://localhost:8000';
    this.secret  = config.get('AI_SERVICE_SECRET') ?? '';
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.secret ? { 'x-ai-secret': this.secret } : {}),
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`AI service error ${res.status}: ${text}`);
      throw new Error(`AI service returned ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async generateRoadmap(data: {
    target_role: string;
    skills: string[];
    experience_years: number;
    classification: string;
    course_interest?: string;
    learning_availability?: string;
  }) {
    return this.post('/api/v1/roadmap', data);
  }

  async generateMockQuestions(data: {
    target_role: string;
    skills: string[];
    experience_years: number;
    round_type?: string;
    num_questions?: number;
  }) {
    return this.post('/api/v1/mock-interview', data);
  }

  async reviewResume(data: {
    resume_text: string;
    target_role: string;
    job_description?: string;
  }) {
    return this.post('/api/v1/resume-review', data);
  }

  async answerDoubt(data: {
    question: string;
    course_title?: string;
    lesson_title?: string;
    context?: string;
  }) {
    return this.post('/api/v1/doubt', data);
  }
}
