"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../src/lib/api";
import { toast } from "sonner";
import {
  Headphones, Plus, ChevronRight, Loader2,
  CheckCircle2,
} from "lucide-react";

const ticketSchema = z.object({
  subject:  z.string().min(5, "Subject must be at least 5 characters"),
  body:     z.string().min(10, "Please describe your issue in more detail"),
  category: z.string().optional(),
  priority: z.string().optional(),
});
type TicketForm = z.infer<typeof ticketSchema>;

const commentSchema = z.object({ body: z.string().min(1, "Reply cannot be empty") });
type CommentForm = z.infer<typeof commentSchema>;

const fetchMyTickets  = () => api.get("/support/mine").then((r) => r.data);
const fetchTicket     = (id: string) => api.get(`/support/${id}`).then((r) => r.data);

const CATEGORIES = [
  "LMS", "PAYMENT", "SCHEDULE", "TRAINER", "ASSIGNMENT",
  "PROJECT", "INTERVIEW", "RESUME", "MOCK", "PLACEMENT",
  "TECHNICAL", "OTHER",
];

const statusColor: Record<string, string> = {
  OPEN:               "bg-blue-500/20 text-blue-300",
  IN_PROGRESS:        "bg-amber-500/20 text-amber-300",
  WAITING_ON_STUDENT: "bg-violet-500/20 text-violet-300",
  RESOLVED:           "bg-emerald-500/20 text-emerald-300",
  CLOSED:             "bg-slate-700 text-slate-400",
};

const priorityColor: Record<string, string> = {
  URGENT: "text-red-400",
  HIGH:   "text-orange-400",
  NORMAL: "text-slate-400",
  LOW:    "text-slate-500",
};

export default function SupportPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: fetchMyTickets,
  });

  const { data: ticket } = useQuery({
    queryKey: ["ticket", activeId],
    queryFn: () => fetchTicket(activeId!),
    enabled: !!activeId && view === "detail",
    refetchInterval: view === "detail" ? 15000 : false,
  });

  const {
    register: regTicket,
    handleSubmit: handleTicket,
    reset: resetTicket,
    formState: { errors: ticketErrors },
  } = useForm<TicketForm>({ resolver: zodResolver(ticketSchema) });

  const {
    register: regComment,
    handleSubmit: handleComment,
    reset: resetComment,
    formState: { errors: commentErrors },
  } = useForm<CommentForm>({ resolver: zodResolver(commentSchema) });

  const createTicket = useMutation({
    mutationFn: (data: TicketForm) =>
      api.post("/support", data).then((r) => r.data),
    onSuccess: (data) => {
      toast.success("Ticket raised successfully!");
      resetTicket();
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      setActiveId(data.id);
      setView("detail");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to raise ticket");
    },
  });

  const addComment = useMutation({
    mutationFn: (data: CommentForm) =>
      api.post(`/support/${activeId}/comments`, data).then((r) => r.data),
    onSuccess: () => {
      resetComment();
      qc.invalidateQueries({ queryKey: ["ticket", activeId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not send reply");
    },
  });

  /* ── List view ── */
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Support</h1>
            <p className="mt-1 text-sm text-slate-400">
              Raise and track your support tickets here.
            </p>
          </div>
          <button
            onClick={() => setView("new")}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" /> New ticket
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <Headphones className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">No tickets yet.</p>
            <button
              onClick={() => setView("new")}
              className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Raise your first ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <button
                key={t.id}
                onClick={() => { setActiveId(t.id); setView("detail"); }}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-left transition hover:border-indigo-400/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Headphones className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{t.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.ticketCode} · {t.category}
                    {t._count?.comments > 0 && ` · ${t._count.comments} repl${t._count.comments === 1 ? "y" : "ies"}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium ${priorityColor[t.priority] ?? "text-slate-400"}`}>
                    {t.priority}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status] ?? "bg-slate-700 text-slate-400"}`}>
                    {t.status.replace(/_/g, " ")}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── New ticket view ── */
  if (view === "new") {
    return (
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("list")}
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">New support ticket</h1>
        </div>

        <form
          onSubmit={handleTicket((d) => createTicket.mutate(d))}
          className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Subject</label>
            <input
              {...regTicket("subject")}
              placeholder="Brief description of your issue"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
            {ticketErrors.subject && (
              <p className="mt-1 text-xs text-red-400">{ticketErrors.subject.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
              <select
                {...regTicket("category")}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Priority</label>
              <select
                {...regTicket("priority")}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
            <textarea
              {...regTicket("body")}
              rows={5}
              placeholder="Describe your issue in detail…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            />
            {ticketErrors.body && (
              <p className="mt-1 text-xs text-red-400">{ticketErrors.body.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={createTicket.isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {createTicket.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit ticket
          </button>
        </form>
      </div>
    );
  }

  /* ── Detail / conversation view ── */
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("list")}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← My tickets
        </button>
      </div>

      {!ticket ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading ticket…
        </div>
      ) : (
        <>
          {/* Ticket header */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-slate-500">{ticket.ticketCode}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{ticket.subject}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {ticket.category} · {ticket.priority} priority
                  {ticket.owner && ` · Assigned to ${ticket.owner.name}`}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColor[ticket.status] ?? "bg-slate-700 text-slate-400"}`}>
                {ticket.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{ticket.body}</p>
            <p className="mt-3 text-xs text-slate-600">
              Opened {new Date(ticket.createdAt).toLocaleString("en-IN")}
              {ticket.dueAt && ` · SLA due ${new Date(ticket.dueAt).toLocaleString("en-IN")}`}
            </p>
          </div>

          {/* Comments */}
          {ticket.comments?.length > 0 && (
            <div className="space-y-3">
              {ticket.comments.map((c: any) => {
                const isStaff = !["STUDENT"].includes(c.author?.role);
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-4 ${
                      isStaff
                        ? "border-indigo-400/20 bg-indigo-500/5"
                        : "border-white/10 bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-300">
                        {c.author?.name ?? "You"}
                        {isStaff && (
                          <span className="ml-2 rounded-full bg-indigo-500/20 px-2 py-0.5 text-indigo-300">
                            Staff
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-600">
                        {new Date(c.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{c.body}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply box — only if not closed */}
          {!["RESOLVED", "CLOSED"].includes(ticket.status) && (
            <form
              onSubmit={handleComment((d) => addComment.mutate(d))}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 space-y-3"
            >
              <label className="text-sm font-medium text-slate-300">Add a reply</label>
              <textarea
                {...regComment("body")}
                rows={3}
                placeholder="Type your reply…"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              />
              {commentErrors.body && (
                <p className="text-xs text-red-400">{commentErrors.body.message}</p>
              )}
              <button
                type="submit"
                disabled={addComment.isPending}
                className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
              >
                {addComment.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send reply
              </button>
            </form>
          )}

          {["RESOLVED", "CLOSED"].includes(ticket.status) && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              This ticket has been {ticket.status.toLowerCase()}.
            </div>
          )}
        </>
      )}
    </div>
  );
}
