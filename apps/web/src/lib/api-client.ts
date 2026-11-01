export { api } from "./api";
export type { } from "./api";

export type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  price: number;
  status: string;
  modules?: any[];
};
