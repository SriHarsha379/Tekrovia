const STAGES = [
  { number: "01", label: "Attract", detail: "Meta, Google, YouTube and LinkedIn campaigns." },
  { number: "02", label: "Assess", detail: "Career, skill and resume assessment." },
  { number: "03", label: "Train", detail: "Recorded, live, labs and projects." },
  { number: "04", label: "Prepare", detail: "AI practice and expert mocks." },
  { number: "05", label: "Place", detail: "Verified matching and recruiter support." },
];

/**
 * Numbered stages are appropriate here — this content genuinely is a
 * sequence (the blueprint's Attract -> Assess -> Train -> Prepare -> Place
 * pipeline), not a decorative 01/02/03 applied to unordered content.
 */
export function JourneySection() {
  return (
    <ol className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-5">
      {STAGES.map((stage) => (
        <li key={stage.number} className="flex flex-col gap-2 bg-paper p-6">
          <span className="font-display text-2xl text-gold">{stage.number}</span>
          <span className="font-body text-base font-semibold text-ink">{stage.label}</span>
          <span className="font-body text-sm text-ink/70">{stage.detail}</span>
        </li>
      ))}
    </ol>
  );
}
