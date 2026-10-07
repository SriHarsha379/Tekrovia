import axios from 'axios';
import { z } from 'zod';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE_URL = `${API_ORIGIN}/api/v1`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the current session token to API requests in the browser.
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.sessionStorage.getItem(
      'tekrovia_access_token'
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Response schemas
export const productSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
});

export const assessmentResponseSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  score: z.number().optional(),
  classification: z.enum(['beginner', 'starter', 'pro']).optional(),
  createdAt: z.string(),
});

export const trialRegistrationSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  sessionNumber: z.number(),
  scheduledAt: z.string(),
  status: z.string(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  courseInterest: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']).optional(),
});

export const assessmentFormSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/),
  education: z.string(),
  experienceYears: z.number().min(0).max(50),
  skills: z.array(z.string()),
  targetRole: z.string(),
  careerGapMonths: z.number().optional(),
});

export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  description: z.string(),
  duration: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number(),
  learningOutcomes: z.array(z.string()),
  curriculum: z.array(
    z.object({
      module: z.string(),
      topics: z.array(z.string()),
    })
  ),
});

// API methods
export const api = {
  // Authentication
  auth: {
    register: async (data: {
      name: string;
      email: string;
      phone: string;
      password?: string;
    }) => {
      const response = await apiClient.post('/auth/register', data);
      return response.data as {
        id: string;
        email: string;
        role: string;
        requiresOtp: boolean;
      };
    },

    login: async (data: {
      email: string;
      password?: string;
    }) => {
      const response = await apiClient.post('/auth/login', data);
      return response.data as {
        userId: string;
        otp: string;
        expiresAt: string;
        message: string;
      };
    },

    verifyOtp: async (data: {
      email: string;
      otp: string;
    }) => {
      const response = await apiClient.post('/auth/verify-otp', data);
      return response.data as {
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
        };
      };
    },
  },

  // Candidate profile and onboarding
  candidates: {
    getForUser: async (userId: string) => {
      const response = await apiClient.get(`/candidates/user/${encodeURIComponent(userId)}`);
      return response.data as {
        id: string;
        candidateCode: string;
        userId: string;
        fullName: string;
        email: string;
        phone: string;
        education?: string | null;
        graduationYear?: number | null;
        experienceYears: number;
        skills: string[];
        targetRole?: string | null;
        courseInterest?: string | null;
        assessments: Array<{
          id: string;
          type: string;
          title: string;
          description?: string | null;
          score?: number | null;
          maxScore: number;
          classification?: string | null;
          status: string;
          startedAt: string;
          completedAt?: string | null;
          createdAt: string;
          updatedAt: string;
        }>;
      };
    },
    createForUser: async (
      userId: string,
      data: {
        fullName: string;
        email: string;
        phone: string;
        education?: string;
        graduationYear?: number;
        experienceYears?: number;
        skills?: string[];
        targetRole?: string;
        courseInterest?: string;
        codingPreference?: string;
        learningAvailability?: string;
        preferredSchedule?: string;
        previousTraining?: string;
        careerGapMonths?: number;
        resumeUrl?: string;
        consentGiven?: boolean;
      }
    ) => {
      const response = await apiClient.post(
        `/candidates/user/${encodeURIComponent(userId)}`,
        data
      );
      return response.data;
    },
  },

  // Products
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return z.array(productSchema).parse(response.data);
  },

  // Interactive technical assessment: questions are supplied by the API,
  // and the server calculates the final score.
  startInteractiveAssessment: async () => {
    const response = await apiClient.post('/assessments/me/interactive');
    return response.data as {
      assessment: {
        id: string;
        candidateId: string;
        status: string;
        startedAt: string;
      };
      totalQuestions: number;
      questions: Array<{
        id: string;
        category: string;
        prompt: string;
        options: string[];
      }>;
    };
  },

  submitInteractiveAssessment: async (
    assessmentId: string,
    answers: Array<{ questionId: string; answerIndex: number }>
  ) => {
    const response = await apiClient.post(
      `/assessments/${assessmentId}/interactive-submit`,
      { answers }
    );
    return response.data as {
      id: string;
      candidateId: string;
      title: string;
      score: number | null;
      maxScore: number;
      classification: string | null;
      status: string;
      responses: {
        correctCount?: number;
        totalQuestions?: number;
        categoryResults?: Array<{
          category: string;
          correct: number;
          total: number;
          percentage: number;
        }>;
        strengths?: string[];
        improvementAreas?: Array<{
          category: string;
          correct: number;
          total: number;
          percentage: number;
        }>;
        answers?: Array<{
          questionId: string;
          category: string;
          selectedIndex: number;
          correct: boolean;
          explanation: string;
        }>;
      };
      roadmap: {
        recommendations?: string[];
      } | null;
      completedAt: string | null;
      createdAt: string;
    };
  },

  // Career-readiness assessment for the authenticated student's own profile.
  createCareerReadinessAssessment: async () => {
    const response = await apiClient.post(
      '/assessments/me/career-readiness'
    );
    return response.data as {
      id: string;
      candidateId: string;
      type?: string;
      title?: string;
      score?: number | null;
      maxScore?: number;
      classification?: string | null;
      status?: string;
      responses?: unknown;
      roadmap?: unknown;
      createdAt?: string;
    };
  },

  // Assessment
  createAssessment: async (
    data: z.infer<typeof assessmentFormSchema>
  ) => {
    const response = await apiClient.post('/assessments', data);
    return assessmentResponseSchema.parse(response.data);
  },

  getAssessment: async (id: string) => {
    const response = await apiClient.get(`/assessments/${id}`);
    return assessmentResponseSchema.parse(response.data);
  },

  // Trial
  registerForTrial: async (data: {
    email: string;
    phone: string;
    fullName: string;
    sessionNumber: number;
  }) => {
    const response = await apiClient.post('/trial/register', data);
    return trialRegistrationSchema.parse(response.data);
  },

  // Contact
  submitContact: async (
    data: z.infer<typeof contactFormSchema>
  ) => {
    const response = await apiClient.post('/contact', data);
    return z.object({ success: z.boolean() }).parse(response.data);
  },

  // Courses
  getCourses: async (filters?: {
    category?: string;
    level?: string;
  }) => {
    const response = await apiClient.get('/courses', {
      params: filters,
    });
    return z.array(courseSchema).parse(response.data);
  },

  getCourse: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}`);
    return courseSchema.parse(response.data);
  },

  // Learning and enrollment
  enrollCourse: async (courseId: string) => {
    const response = await apiClient.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await apiClient.get('/courses/my/enrollments');
    return response.data;
  },

  getMyLearningProgress: async () => {
    const response = await apiClient.get('/courses/my/progress');
    return response.data;
  },

  completeLesson: async (lessonId: string) => {
    const response = await apiClient.post(
      `/courses/lessons/${lessonId}/complete`
    );
    return response.data;
  },

  // Assignments
  getMyAssignments: async () => {
    const response = await apiClient.get('/assignments/my');
    return response.data;
  },

  submitAssignment: async (
    assignmentId: string,
    data: { submissionText: string | null; submissionUrl: string | null }
  ) => {
    const response = await apiClient.post(
      `/assignments/${encodeURIComponent(assignmentId)}/submit`,
      data
    );
    return response.data;
  },

  // Projects
  getMyProjects: async () => {
    const response = await apiClient.get('/projects/my');
    return response.data;
  },

  submitMilestone: async (
    milestoneId: string,
    data: { submissionText: string | null; submissionUrl: string | null }
  ) => {
    const response = await apiClient.post(
      `/projects/milestones/${encodeURIComponent(milestoneId)}/submit`,
      data
    );
    return response.data;
  },

  // Placement readiness (the learner's own checklist)
  getMyReadiness: async () => {
    const response = await apiClient.get('/placements/me/readiness');
    return response.data;
  },

  // Analytics
  trackEvent: async (data: {
    event: string;
    properties?: Record<string, any>;
  }) => {
    try {
      await apiClient.post('/analytics/events', data);
    } catch (error) {
      console.error('Analytics event failed:', error);
    }
  },
};

export type Product = z.infer<typeof productSchema>;
export type Assessment = z.infer<typeof assessmentResponseSchema>;
export type TrialRegistration = z.infer<typeof trialRegistrationSchema>;
export type Course = z.infer<typeof courseSchema>;
