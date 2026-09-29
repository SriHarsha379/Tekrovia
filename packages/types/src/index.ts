export type UserRole =
  | 'STUDENT'
  | 'TRAINER'
  | 'COUNSELLOR'
  | 'SUPPORT_STAFF'
  | 'PLACEMENT_MANAGER'
  | 'RECRUITER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

export interface ProductSummary {
  code: string;
  name: string;
  priceInr: number;
}
