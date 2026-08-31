"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createLead, ApiError } from "@/lib/api";

type Status = "idle" | "submitting" | "success" | "error";

export function LeadCaptureForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    try {
      await createLead({
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        landing_page_url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-teal bg-white p-6">
        <p className="font-display text-xl text-ink">You&apos;re on the list.</p>
        <p className="mt-2 font-body text-ink/70">
          We&apos;ll reach out to schedule your free assessment shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-line bg-white p-6">
      <Input name="name" label="Full name" required autoComplete="name" />
      <Input name="phone" label="Phone number" type="tel" required autoComplete="tel" />
      <Input name="email" label="Email" type="email" required autoComplete="email" />
      {status === "error" && <p className="font-body text-sm text-red-700">{errorMessage}</p>}
      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Start my free assessment"}
      </Button>
    </form>
  );
}
