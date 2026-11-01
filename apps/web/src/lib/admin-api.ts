import { api } from "./api";
import { useAuthStore } from "../store/auth";

export const adminApi = api;

export function readAdminUser() {
  return useAuthStore.getState().user;
}

export function isAdmin(role: string) {
  return ["ADMIN", "SUPER_ADMIN"].includes(role);
}
