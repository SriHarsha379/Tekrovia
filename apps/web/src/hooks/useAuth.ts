import { api } from "../lib/api";

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
}) {
  const res = await api.post("/auth/register", data);
  return res.data;
}

export async function loginUser(data: { email: string; password?: string }) {
  const res = await api.post("/auth/login", data);
  return res.data;
}

export async function verifyOtp(data: { email: string; otp: string }) {
  const res = await api.post("/auth/verify-otp", data);
  return res.data;
}
