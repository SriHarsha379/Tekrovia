export type RecoveryInfo = {
  threshold: number;
  failedInterviewCount: number;
  recoveryNeeded: boolean;
  failedInterviews: Array<{
    id: string;
    companyName: string;
    jobTitle: string;
    round: number;
    title?: string | null;
    scheduledAt: string;
    feedback?: string | null;
  }>;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RecoveryPanel({ recovery }: { recovery?: RecoveryInfo }) {
  if (!recovery) return null;

  const { failedInterviewCount, threshold, recoveryNeeded, failedInterviews } = recovery;

  return (
    <section aria-label="Interview recovery">
      <h3 className="mb-3 font-semibold">Interview recovery</h3>

      {recoveryNeeded ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-200"
        >
          <p className="font-semibold">
            Recovery needed: {failedInterviewCount} unsuccessful interviews
          </p>
          <p className="mt-2 text-amber-100/90">
            Suggested next steps from the blueprint: record the rejection reasons,
            pause new submissions, run a trainer-led skill-gap assessment, schedule one
            week of brush-up, repeat a mock interview, and return to placement only
            after reassessment. Nothing has been paused automatically.
          </p>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-950 p-3 text-sm text-slate-300">
          {failedInterviewCount} of {threshold} unsuccessful interviews.
        </p>
      )}

      {failedInterviews.length > 0 && (
        <ul className="mt-3 space-y-2">
          {failedInterviews.map((interview) => (
            <li
              key={interview.id}
              className="rounded-xl border border-slate-800 p-3 text-sm"
            >
              <p className="font-medium">
                {interview.companyName} · {interview.jobTitle}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Round {interview.round}
                {interview.title ? ` (${interview.title})` : ""} ·{" "}
                {formatDate(interview.scheduledAt)}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-slate-300">
                {interview.feedback?.trim() || "No reason recorded."}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
