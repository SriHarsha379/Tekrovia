import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Learn",
    description:
      "Build practical skills with structured learning paths and guided content.",
  },
  {
    number: "02",
    title: "Practice",
    description:
      "Strengthen your knowledge through assessments and hands-on exercises.",
  },
  {
    number: "03",
    title: "Get Placed",
    description:
      "Prepare for interviews, explore opportunities, and track your career journey.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Tek<span className="text-indigo-400">Rovia</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#journey" className="transition hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <section
        id="journey"
        className="relative isolate overflow-hidden px-6 py-24 sm:py-32"
      >
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl"
        />

        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-200">
            Your future starts here
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            From learning
            <br />
            to <span className="text-indigo-400">placement.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-300">
            Learn in-demand skills. Build real projects. Prepare for
            interviews. Access structured placement support.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-500 px-7 py-4 font-semibold shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:bg-indigo-400"
            >
              Start your journey →
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/15 px-7 py-4 font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Explore features
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
            The TekRovia journey
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Everything you need to move forward
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            A structured journey designed to help you develop your skills
            and prepare for employment.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-indigo-400/40"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 font-bold text-indigo-300">
                {feature.number}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-white/10 bg-slate-900/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Programs and pricing
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Choose the support that fits your goals
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              Start with a focused program or explore the complete learning-to-placement pathway.
              Review each program&apos;s deliverables before enrolling.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                name: "Technology Training",
                price: "₹9,999",
                description: "Build practical technical skills through guided learning.",
                items: ["Structured training modules", "Guided hands-on labs", "Assignments and practice", "Two guided projects"],
              },
              {
                name: "Interview Preparation",
                price: "₹9,999",
                description: "Prepare for technical and HR interviews with expert support.",
                items: ["Interview preparation curriculum", "AI practice", "Three expert mock interviews", "Resume preparation"],
              },
              {
                name: "Placement Support",
                price: "₹9,999",
                description: "Access structured support throughout your job search.",
                items: ["Job matching", "Verified job submissions", "Interview coordination", "Feedback tracking"],
              },
              {
                name: "Corporate Soft Skills",
                price: "₹5,000",
                description: "Build communication and workplace skills for professional settings.",
                items: ["Spoken and workplace communication", "HR rounds and group discussions", "Business email and presentations", "Client communication"],
              },
            ].map((program) => (
              <article
                key={program.name}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-indigo-400/40"
              >
                <div>
                  <h3 className="text-lg font-semibold">{program.name}</h3>
                  <p className="mt-3 text-3xl font-bold tracking-tight">{program.price}</p>
                  <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-slate-400">
                    {program.description}
                  </p>
                  <div className="my-6 h-px bg-white/10" />
                  <ul className="space-y-3 text-sm text-slate-300">
                    {program.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="text-indigo-300">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center justify-center rounded-xl border border-indigo-400/40 px-4 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                >
                  Get started
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold">Complete Package</h3>
                <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-3 py-1 text-xs font-medium text-indigo-200">
                  Suggested bundle
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                All listed services in one pathway: technology training, interview preparation,
                placement support, and corporate soft skills.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Suggested introductory price; subject to commercial validation.
              </p>
            </div>
            <div className="mt-5 flex shrink-0 flex-col items-start gap-3 sm:mt-0 sm:items-end">
              <p className="text-3xl font-bold">₹29,999</p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Explore package
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Placement support provides structured assistance and does not guarantee employment.
            Final package details, terms, and pricing should be confirmed before purchase.
          </p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Frequently asked questions
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Got questions? Start here.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Find out more about the learning journey, assessments, programs, and placement support.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              question: "What is the TekRovia learning-to-placement journey?",
              answer:
                "It is a structured pathway that brings together learning, practice, interview preparation, and placement support. Your journey can begin with registration and an assessment to help identify a suitable starting level.",
            },
            {
              question: "Which programs are available?",
              answer:
                "The proposed programs include Technology Training, Interview Preparation, Placement Support, and Corporate Soft Skills. Program content, schedules, and availability should be confirmed with the TekRovia team before enrollment.",
            },
            {
              question: "Can I assess my skills before choosing a program?",
              answer:
                "The platform includes an assessment experience intended to help you understand your current starting point and receive a suggested learning route. The result is a learning guide, not a measure of employability or a guarantee of placement.",
            },
            {
              question: "Is there a free trial or introductory session?",
              answer:
                "The proposed offering includes a free assessment, a three-session trial, and a free 10-minute AI mock interview. Please confirm current availability and scheduling with the TekRovia team.",
            },
            {
              question: "How much do the programs cost?",
              answer:
                "The listed indicative prices are ₹9,999 for Technology Training, ₹9,999 for Interview Preparation, ₹9,999 for Placement Support, and ₹5,000 for Corporate Soft Skills. The suggested ₹29,999 Complete Package is subject to commercial validation. Confirm final pricing and terms before purchasing.",
            },
            {
              question: "What are the refund terms?",
              answer:
                "Refund terms are shared in writing before you pay, so you can review them first. Please confirm them with the TekRovia team before purchasing.",
            },
            {
              question: "Does placement support guarantee a job?",
              answer:
                "No. Placement support is intended to provide structured assistance such as job matching, application support, interview coordination, and feedback tracking. Employment depends on factors including your preparation, role requirements, employer decisions, and available opportunities. A job offer is not guaranteed.",
            },
            {
              question: "What happens after I enroll?",
              answer:
                "The planned onboarding journey includes confirming your enrollment, setting up your learner profile and course access, sharing orientation information, and identifying a support contact. Specific access steps and schedules will be communicated as the program is made available.",
            },
            {
              question: "How can I get help or ask about a program?",
              answer:
                "Use the registration link to begin your journey. For program availability, schedules, final pricing, or enrollment questions, contact the TekRovia team through the official support channel.",
            },
          ].map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:border-indigo-400/40 open:bg-indigo-500/[0.04] sm:p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-slate-100 marker:content-none">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl text-indigo-300 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 pr-6 text-sm leading-7 text-slate-400">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5 text-sm leading-7 text-slate-300 sm:p-6">
          <h3 className="font-semibold text-amber-200">Placement support disclaimer</h3>
          <p className="mt-2">
            TekRovia provides learning, interview preparation, and placement assistance.
            Participation does not guarantee an interview, job offer, salary, or employment
            outcome. Program features, availability, pricing, and terms should be confirmed
            before enrollment.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
          >
            Get started →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TekRovia. All rights reserved.
      </footer>
    </main>
  );
}
