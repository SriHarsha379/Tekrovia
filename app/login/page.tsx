"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loginUser } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/store/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await loginUser({ email: data.email, password: data.password });

      // If server returns a token directly (password login)
      if (res.accessToken) {
        login(res.accessToken, res.user);
        document.cookie = `tekrovia_token=${res.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
        const next = searchParams.get("next") ?? "/dashboard";
        router.push(next);
        return;
      }

      // OTP flow
      setPendingEmail(data.email);
      toast.success("OTP sent to your email");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return <OtpStep email={pendingEmail} />;
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/60 p-8"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function OtpStep({ email }: { email: string }) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const { verifyOtp } = await import("../../src/hooks/useAuth");
      const res = await verifyOtp({ email, otp });
      login(res.accessToken, res.user);
      document.cookie = `tekrovia_token=${res.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
        <h2 className="text-xl font-bold text-white">Check your email</h2>
        <p className="mt-2 text-sm text-slate-400">
          We sent a 6-digit code to <span className="text-white">{email}</span>
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="mx-auto mt-6 block w-40 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-widest text-white outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify OTP
        </button>
      </div>
    </main>
  );
}
