import Link from "next/link";

export type DeliveryStats = {
  activeLearners: number;
  completedEnrollments: number;
  completionRate: number | null;
  assignmentsAwaitingReview: number;
  projectSubmissionsAwaitingReview: number;
  assignmentsApproved: number;
  projectMilestonesApproved: number;
};

function format(value: number): string {
  return value.toLocaleString("en-IN");
}

export default function DeliveryOverview({
  delivery,
}: {
  delivery?: DeliveryStats;
}) {
  if (!delivery) return null;

  const items: Array<{ label: string; value: string }> = [
    { label: "Active learners", value: format(delivery.activeLearners) },
    { label: "Completed courses", value: format(delivery.completedEnrollments) },
    {
      label: "Completion rate",
      value: delivery.completionRate === null ? "—" : `${delivery.completionRate}%`,
    },
    {
      label: "Assignments awaiting review",
      value: format(delivery.assignmentsAwaitingReview),
    },
    {
      label: "Project submissions awaiting review",
      value: format(delivery.projectSubmissionsAwaitingReview),
    },
    { label: "Assignments approved", value: format(delivery.assignmentsApproved) },
    {
      label: "Project milestones approved",
      value: format(delivery.projectMilestonesApproved),
    },
  ];

  return (
    <section aria-label="Delivery overview" className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Delivery</h2>
          <p className="mt-1 text-sm text-slate-400">
            Learning activity across all courses.
          </p>
        </div>
        <Link
          href="/review"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
        >
          Open review queue
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-300">
              {item.value}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Not tracked yet: attendance, risk alerts and support tickets.
      </p>
    </section>
  );
}
