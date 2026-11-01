"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../../../src/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Users, X } from "lucide-react";

const fetchBatches = () => api.get("/batches").then((r) => r.data);
const fetchTrainers = () => api.get("/batches/trainers").then((r) => r.data);
const fetchCourses  = () => api.get("/courses").then((r) => r.data);

export default function BatchesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["admin-batches"], queryFn: fetchBatches });
  const { data: trainers = [] } = useQuery({ queryKey: ["trainers"], queryFn: fetchTrainers });
  const { data: courses  = [] } = useQuery({ queryKey: ["all-courses"], queryFn: fetchCourses });

  const { register, handleSubmit, reset } = useForm<any>();

  const createBatch = useMutation({
    mutationFn: (d: any) => api.post("/batches", d).then((r) => r.data),
    onSuccess: () => {
      toast.success("Batch created!");
      reset();
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-batches"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed"),
  });

  const batches = data?.batches ?? [];

  const statusColor: Record<string, string> = {
    UPCOMING:   "bg-blue-500/20 text-blue-300",
    ACTIVE:     "bg-emerald-500/20 text-emerald-300",
    COMPLETED:  "bg-slate-700 text-slate-400",
    CANCELLED:  "bg-red-500/20 text-red-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Batches</h1>
          <p className="mt-1 text-sm text-slate-400">Manage training batches and student enrollment.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New batch"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d) => createBatch.mutate(d))}
          className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4"
        >
          <h2 className="font-semibold text-white">Create batch</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Batch name</label>
              <input {...register("name", { required: true })} placeholder="GenAI Batch 1" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Course</label>
              <select {...register("courseId", { required: true })} className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                <option value="">Select course</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Trainer</label>
              <select {...register("trainerId")} className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                <option value="">Unassigned</option>
                {trainers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Capacity</label>
              <input {...register("capacity")} type="number" defaultValue={15} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Start date</label>
              <input {...register("startDate")} type="date" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">End date</label>
              <input {...register("endDate")} type="date" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
          </div>
          <button type="submit" disabled={createBatch.isPending} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
            {createBatch.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create batch
          </button>
        </form>
      )}

      {/* Batch list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-slate-500">No batches yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {batches.map((b: any) => (
            <div key={b.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{b.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.course?.title}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[b.status] ?? "bg-slate-700 text-slate-400"}`}>
                  {b.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {b._count?.members ?? 0}/{b.capacity}
                </span>
                {b.trainer && <span>Trainer: {b.trainer.name}</span>}
              </div>
              {b.startDate && (
                <p className="text-xs text-slate-500">
                  {new Date(b.startDate).toLocaleDateString("en-IN")}
                  {b.endDate && ` → ${new Date(b.endDate).toLocaleDateString("en-IN")}`}
                </p>
              )}
              {/* Capacity bar */}
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, Math.round(((b._count?.members ?? 0) / b.capacity) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
