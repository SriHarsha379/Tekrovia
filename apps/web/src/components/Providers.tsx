"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { setAuthCookie } from "../lib/cookie";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function TokenSync() {
  const token = useAuthStore((s) => s.token);
  const prevToken = useRef<string | null>(null);

  useEffect(() => {
    if (token !== prevToken.current) {
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        // Re-sync cookie from store on every page load
        setAuthCookie(token);
      } else {
        delete api.defaults.headers.common["Authorization"];
      }
      prevToken.current = token;
    }
  }, [token]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TokenSync />
      {children}
    </QueryClientProvider>
  );
}
