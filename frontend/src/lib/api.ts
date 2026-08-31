const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail ?? `Request to ${path} failed`, res.status);
  }

  return res.json() as Promise<T>;
}

export interface LeadCreatePayload {
  name?: string;
  phone?: string;
  email?: string;
  landing_page_url?: string;
}

export interface LeadRead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
}

export function createLead(payload: LeadCreatePayload) {
  return request<LeadRead>("/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
