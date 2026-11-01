"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

const fetchFunnel      = (days: number) => api.get("/marketing/funnel",      { params: { days } }).then((r) => r.data);
const fetchAttribution = (days: number) => api.get("/marketing/attribution", { params: { days } }).then((r) => r.data);
const fetchDaily       = (days: number) => api.get("/marketing/daily",       { params: { days } }).then((r) => r.data);

const WINDOWS = [7, 14, 30, 90];

export default function MarketingPage() {
  const [days, setDays] = useState(30);

  const { data: funnel,      isLoading: fl } = useQuery({ queryKey: ["mkt-funnel",      days], queryFn: () => fetchFunnel(days) });
  const { data: attribution, isLoading: al } = useQuery({ queryKey: ["mkt-attribution", days], queryFn: () => fetchAttribution(days) });
  const { data: daily = [],  isLoading: dl } = useQuery({ queryKey: ["mkt-daily",       days], queryFn: () => fetchDaily(days) });

  const loading = fl || al || dl;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Lead funnel, attribution and daily trend.</p>
        </div>
        <div className="flex gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                days === w
                  ? "bg-indigo-500 text-white"
                  : "border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Headline stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total Leads",      value: funnel?.totalLeads  ?? 0 },
              { label: "Enrolled",         value: funnel?.enrolled    ?? 0 },
              { label: "Dropped",          value: funnel?.dropped     ?? 0 },
              { label: "Conversion Rate",  value: funnel?.conversionRate != null ? `${funnel.conversionRate}%` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Funnel stages */}
          {funnel?.funnel?.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Funnel Stages</h2>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Stage</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">At Stage</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Reached</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {funnel.funnel.map((row: any) => {
                      const pct = funnel.totalLeads > 0
                        ? Math.round((row.reached / funnel.totalLeads) * 100)
                        : 0;
                      return (
                        <tr key={row.stage} className="hover:bg-white/5">
                          <td className="px-5 py-3 text-slate-300">{row.stage}</td>
                          <td className="px-5 py-3 text-right font-semibold text-white">{row.atStage}</td>
                          <td className="px-5 py-3 text-right text-slate-400">{row.reached}</td>
                          <td className="px-5 py-3 w-40">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily trend */}
          {daily.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Daily Lead Volume</h2>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                <div className="flex items-end gap-1 h-32">
                  {daily.map((d: any) => {
                    const max = Math.max(...daily.map((x: any) => x.leads), 1);
                    const h = Math.round((d.leads / max) * 100);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full rounded-t bg-indigo-500/60 group-hover:bg-indigo-500 transition"
                          style={{ height: `${h}%`, minHeight: d.leads > 0 ? "4px" : "0" }}
                        />
                        <div className="absolute bottom-full mb-1 hidden group-hover:block rounded bg-slate-800 px-2 py-1 text-xs text-white whitespace-nowrap">
                          {d.date}: {d.leads} leads, {d.enrolled} enrolled
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-600">
                  <span>{daily[0]?.date}</span>
                  <span>{daily[daily.length - 1]?.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* Attribution by source */}
          {attribution?.bySource?.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Attribution by Source</h2>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Source", "Leads", "Enrolled", "Conversion"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attribution.bySource.map((row: any) => (
                      <tr key={row.name} className="hover:bg-white/5">
                        <td className="px-5 py-3 text-slate-300">{row.name}</td>
                        <td className="px-5 py-3 font-semibold text-white">{row.leads}</td>
                        <td className="px-5 py-3 text-slate-300">{row.enrolled}</td>
                        <td className="px-5 py-3">
                          <span className={`flex items-center gap-1 text-xs font-medium ${row.conversionRate > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                            {row.conversionRate > 0
                              ? <TrendingUp className="h-3 w-3" />
                              : <TrendingDown className="h-3 w-3" />}
                            {row.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unavailable notice */}
          {funnel?.unavailable?.length > 0 && (
            <p className="text-xs text-slate-600">
              Note: {funnel.unavailable.join(", ")} data requires ad-platform and payment integrations.
            </p>
          )}
        </>
      )}
    </div>
  );
}
