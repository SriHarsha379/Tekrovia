import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,  // sends the httpOnly tekrovia_token cookie automatically
});

// No localStorage interceptor — the httpOnly cookie handles auth.
// On 401 clear local state and redirect to login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
