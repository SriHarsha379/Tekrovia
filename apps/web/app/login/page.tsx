"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { loginUser, verifyOtp } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/store/auth";
import { setAuthCookie } from "../../src/lib/cookie";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "TRAINER", "COUNSELLOR", "SUPPORT_STAFF", "PLACEMENT_MANAGER"];

function getRedirectPath(role: string, fallback: string | null): string {
  if (ADMIN_ROLES.includes(role)) return "/admin";
  return fallback ?? "/dashboard";
}

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuthStore();
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp]                   = useState("");
  const [devOtp, setDevOtp]             = useState<string | null>(null);
  const [otpLoading, setOtpLoading]     = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fillDemo = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "TestPass123!", { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await loginUser({ email: data.email, password: data.password });
      if (res.accessToken) {
        login(res.accessToken, res.user);
        setAuthCookie(res.accessToken);
        router.push(getRedirectPath(res.user.role, searchParams.get("next")));
        return;
      }
      setPendingEmail(data.email);
      if (res.otp) {
        setDevOtp(res.otp);
        setOtp(res.otp);
        toast.info(`Dev mode — OTP: ${res.otp}`, { duration: 10000 });
      } else {
        toast.success("OTP sent — check your email");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async () => {
    if (!pendingEmail) return;
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setOtpLoading(true);
    try {
      const res = await verifyOtp({ email: pendingEmail, otp });
      login(res.accessToken, res.user);
      setAuthCookie(res.accessToken);
      router.push(getRedirectPath(res.user.role, searchParams.get("next")));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Tek<span className="text-indigo-400">Rovia</span>
          </Link>
          <h2 className="mt-6 text-xl font-bold text-white">Check your email</h2>
          <p className="mt-2 text-sm text-slate-400">
            6-digit code sent to <span className="text-white">{pendingEmail}</span>
          </p>
          {devOtp && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
              <p className="text-xs font-semibold text-amber-400">Dev mode — OTP auto-filled</p>
              <p className="mt-1 text-2xl font-bold tracking-widest text-amber-300">{devOtp}</p>
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mx-auto mt-5 block w-40 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-widest text-white outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleOtp}
            disabled={otpLoading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {otpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify OTP
          </button>
          <button
            onClick={() => { setPendingEmail(null); setDevOtp(null); setOtp(""); }}
            className="mt-3 text-sm text-slate-500 hover:text-slate-300"
          >
            ← Back to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Tek<span className="text-indigo-400">Rovia</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/60 p-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Register</Link>
          </p>
        </form>

        <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/30 p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Demo accounts — click to fill</p>
          <div className="space-y-2">
            <button type="button" onClick={() => fillDemo("demo.student@tekrovia.dev")}
              className="flex w-full items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/10 hover:text-white transition">
              👤 Student — <span className="text-slate-300">demo.student@tekrovia.dev</span>
            </button>
            <button type="button" onClick={() => fillDemo("admin@tekrovia.dev")}
              className="flex w-full items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/10 hover:text-white transition">
              🛡️ Admin — <span className="text-slate-300">admin@tekrovia.dev</span>
            </button>
            <p className="px-3 text-xs text-slate-600">Password auto-fills · OTP auto-fills in dev mode</p>
          </div>
        </div>
      </div>
    </main>
  );
}
