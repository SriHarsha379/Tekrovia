"use client";

import { homeForRole } from "../../src/lib/role-home";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { api } from "@/lib/api-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await api.auth.login({ email, password });

      // Local-development aid only: the current API returns the OTP.
      setDevOtp(result.otp);
      setOtpStage(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to log in. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await api.auth.verifyOtp({ email, otp });

      // Temporary local prototype storage.
      // Replace with a secure HttpOnly-cookie session before production.
      sessionStorage.setItem("tekrovia_access_token", result.accessToken);
      sessionStorage.setItem("tekrovia_user", JSON.stringify(result.user));

      router.replace(homeForRole(result.user.role));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Tek<span className="text-indigo-400">Rovia</span>
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-indigo-400">
            STUDENT PORTAL
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {otpStage ? "Verify your login" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {otpStage
              ? `Enter the verification code for ${email}.`
              : "Sign in to continue your learning journey."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {Array.isArray(error) ? error.join(", ") : error}
          </div>
        )}

        {!otpStage ? (
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
            {devOtp && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                <strong>Development OTP:</strong> {devOtp}
                <p className="mt-1 text-xs text-amber-100/70">
                  Displayed only because the current local API returns the OTP
                  in its response. Remove this before production.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="otp" className="mb-2 block text-sm text-slate-300">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify and sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpStage(false);
                setOtp("");
                setDevOtp("");
                setError("");
              }}
              className="w-full text-sm text-slate-400 hover:text-white"
            >
              Back to login
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          Loading...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}