"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerUser, loginUser, verifyOtp } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/store/auth";
import { readStoredUtm } from "../../src/lib/utm";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Enter a valid phone number"),
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormData = z.infer<typeof schema>;

function setAuthCookie(token: string) {
  document.cookie = `tekrovia_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser({ ...data, ...readStoredUtm() });
      setEmail(data.email);
      await loginUser({ email: data.email, password: data.password });
      toast.success("Account created! Check your email for the OTP.");
      setStep("otp");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setOtpLoading(true);
    try {
      const res = await verifyOtp({ email, otp });
      login(res.accessToken, res.user);
      setAuthCookie(res.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Verify your email</h2>
          <p className="mt-2 text-sm text-slate-400">
            Code sent to <span className="text-white">{email}</span>
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
            onClick={handleOtp}
            disabled={otpLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {otpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & Continue
          </button>
        </div>
      </main>
    );
  }

  const fields = [
    { name: "name", label: "Full name", type: "text", placeholder: "Ravi Kumar" },
    { name: "email", label: "Email", type: "email", placeholder: "ravi@example.com" },
    { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
    { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
  ] as const;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Tek<span className="text-indigo-400">Rovia</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Start your journey</h1>
          <p className="mt-2 text-sm text-slate-400">Create your free account</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/60 p-8"
        >
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                {label}
              </label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {errors[name] && (
                <p className="mt-1 text-xs text-red-400">{errors[name]?.message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
