import { z } from 'zod';

export const leadCaptureSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().email(),
  phone: z.string().regex(/^\\+?[0-9]{10,15}$/),
  courseInterest: z.string().trim().max(150).optional(),
  consent: z.literal(true),
});

export const candidateRegistrationSchema = leadCaptureSchema.extend({
  education: z.string().max(150).optional(),
  graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 10).optional(),
  targetRole: z.string().max(150).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
});

export type LeadCapture = z.infer<typeof leadCaptureSchema>;
export type CandidateRegistration = z.infer<typeof candidateRegistrationSchema>;
