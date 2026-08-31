import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { JourneySection } from "@/components/JourneySection";
import { PricingTable } from "@/components/PricingTable";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";

export default function LandingPage() {
  return (
    <main>
      {/* Hero — dark ink background carries the authority moment */}
      <section className="bg-ink text-paper">
        <Container className="flex flex-col gap-10 py-24 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-xl flex-col gap-6">
            <p className="font-body text-sm font-medium text-gold">SkillMove · TekRovia</p>
            <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
              From learning to placement, in one platform.
            </h1>
            <p className="font-body text-lg text-paper/75">
              Learn in-demand skills, build real projects, prepare for interviews, and access
              structured placement support — guided by AI, validated by experts.
            </p>
          </div>
          <div className="w-full max-w-md lg:min-w-[380px]">
            <LeadCaptureForm />
          </div>
        </Container>
      </section>

      {/* Journey — genuinely staged content, numbering earns its place */}
      <section className="py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="How it works"
            title="Five stages, one continuous path"
            description="Automation handles qualification, access, reminders and reporting. Experts approve projects, mocks and placement submissions."
          />
          <JourneySection />
        </Container>
      </section>

      {/* Pricing */}
      <section className="bg-paper-dim py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Pricing"
            title="Start from ₹9,999"
            description="Purchase one service, or upgrade to the complete package. Every deliverable is shown here — no surprises later."
          />
          <PricingTable />
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-10">
        <Container className="flex flex-col gap-2 font-body text-sm text-ink/60">
          <p>Placement assistance is quality-controlled and never represented as a guaranteed job.</p>
          <p>© {new Date().getFullYear()} SkillMove. All rights reserved.</p>
        </Container>
      </footer>
    </main>
  );
}
