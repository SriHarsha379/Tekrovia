import axios from 'axios';
import { z } from 'zod';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  // Products
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return z.array(productSchema).parse(response.data);
  },

  // Assessment
  createAssessment: async (data: z.infer<typeof assessmentFormSchema>) => {
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
  submitContact: async (data: z.infer<typeof contactFormSchema>) => {
    const response = await apiClient.post('/contact', data);
    return z.object({ success: z.boolean() }).parse(response.data);
  },

  // Courses
  getCourses: async (filters?: { category?: string; level?: string }) => {
    const response = await apiClient.get('/courses', { params: filters });
    return z.array(courseSchema).parse(response.data);
  },

  getCourse: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}`);
    return courseSchema.parse(response.data);
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
