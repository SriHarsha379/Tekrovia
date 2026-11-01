import Link from "next/link";

const features = [
  { number: "01", title: "Learn", description: "Build practical skills with structured learning paths, live classes and guided projects." },
  { number: "02", title: "Practice", description: "Strengthen your knowledge through assessments, assignments and hands-on labs." },
  { number: "03", title: "Get Placed", description: "Prepare for interviews, explore opportunities and track your career journey." },
];

const trainers = [
  {
    name: "Expert Trainer",
    role: "Full Stack & GenAI",
    experience: "8+ years industry experience",
    tags: ["React", "Node.js", "GenAI", "System Design"],
    initial: "E",
  },
  {
    name: "Senior Mentor",
    role: "Data Science & ML",
    experience: "6+ years at top product companies",
    tags: ["Python", "ML", "LLMs", "Data Engineering"],
    initial: "S",
  },
  {
    name: "Career Coach",
    role: "Interview Preparation",
    experience: "Placed 200+ candidates",
    tags: ["Mock Interviews", "Resume", "HR Rounds", "Negotiation"],
    initial: "C",
  },
];

const stats = [
  { value: "500+", label: "Students trained" },
  { value: "85%",  label: "Placement rate" },
  { value: "₹6L+", label: "Average package" },
  { value: "4.8★", label: "Student rating" },
];

const testimonials = [
  {
    name: "Priya S.",
    role: "Got placed as Full Stack Developer",
    package: "₹7.2 LPA",
    text: "TekRovia's structured approach — from learning to mock interviews to placement support — made all the difference. I got placed within 3 months of completing the program.",
  },
  {
    name: "Rahul M.",
    role: "Career switch from non-IT to Software Engineer",
    package: "₹5.5 LPA",
    text: "I had a 2-year career gap and was nervous about switching to tech. The team's support and the readiness gate process gave me the confidence I needed.",
  },
  {
    name: "Anjali K.",
    role: "Freshers → Backend Developer",
    package: "₹6 LPA",
    text: "The projects and expert mock interviews were exactly what companies ask about. The AI doubt assistant helped me whenever I was stuck at odd hours.",
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
            <Link href="/trial" className="transition hover:text-white">Free Trial</Link>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#trainers" className="transition hover:text-white">Trainers</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              Log in
            </Link>
            <Link href="/register" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden px-6 py-24 sm:py-32">
        <div aria-hidden="true" className="absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-200">
            Your future starts here
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            From learning<br />to <span className="text-indigo-400">placement.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-300">
            Learn in-demand skills. Build real projects. Prepare for interviews. Access structured placement support.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/trial" className="rounded-xl bg-indigo-500 px-7 py-4 font-semibold shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:bg-indigo-400">
              Start free trial →
            </Link>
            <Link href="/register" className="rounded-xl border border-white/15 px-7 py-4 font-semibold text-slate-200 transition hover:bg-white/5">
              Register now
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-4xl font-bold text-indigo-400">{value}</p>
                <p className="mt-2 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">The TekRovia journey</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Everything you need to move forward</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">A structured journey designed to help you develop your skills and prepare for employment.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-indigo-400/40">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 font-bold text-indigo-300">
                {feature.number}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Trainers */}
      <section id="trainers" className="border-y border-white/10 bg-slate-900/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">Learn from the best</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Our trainers</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">Industry professionals with real-world experience who have been where you want to go.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {trainers.map((trainer) => (
              <div key={trainer.name} className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-xl font-bold text-indigo-300">
                    {trainer.initial}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{trainer.name}</p>
                    <p className="text-sm text-indigo-400">{trainer.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{trainer.experience}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trainer.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">Student success stories</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Real results from real students</h2>
          <p className="mt-2 text-xs text-slate-500">Results vary. Placement support does not guarantee employment.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-300 text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  {t.package}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-400">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-white/10 bg-slate-900/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">Programs and pricing</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Choose the support that fits your goals</h2>
            <p className="mt-4 leading-7 text-slate-400">Start with a focused program or explore the complete learning-to-placement pathway.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { name: "Technology Training", price: "₹9,999", description: "Build practical technical skills through guided learning.", items: ["Structured training modules", "Guided hands-on labs", "Assignments and practice", "Two guided projects"] },
              { name: "Interview Preparation", price: "₹9,999", description: "Prepare for technical and HR interviews with expert support.", items: ["Interview preparation curriculum", "AI practice", "Three expert mock interviews", "Resume preparation"] },
              { name: "Placement Support", price: "₹9,999", description: "Access structured support throughout your job search.", items: ["Job matching", "Verified job submissions", "Interview coordination", "Feedback tracking"] },
              { name: "Corporate Soft Skills", price: "₹5,000", description: "Build communication and workplace skills for professional settings.", items: ["Spoken and workplace communication", "HR rounds and group discussions", "Business email and presentations", "Client communication"] },
            ].map((program) => (
              <article key={program.name} className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-indigo-400/40">
                <div>
                  <h3 className="text-lg font-semibold">{program.name}</h3>
                  <p className="mt-3 text-3xl font-bold tracking-tight">{program.price}</p>
                  <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-slate-400">{program.description}</p>
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
                <Link href="/register" className="mt-8 inline-flex items-center justify-center rounded-xl border border-indigo-400/40 px-4 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white">
                  Get started
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold">Complete Package</h3>
                <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-3 py-1 text-xs font-medium text-indigo-200">Suggested bundle</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">All listed services in one pathway: technology training, interview preparation, placement support, and corporate soft skills.</p>
            </div>
            <div className="mt-5 flex shrink-0 flex-col items-start gap-3 sm:mt-0 sm:items-end">
              <p className="text-3xl font-bold">₹29,999</p>
              <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
                Explore package
              </Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Placement support provides structured assistance and does not guarantee employment. Final pricing and terms should be confirmed before purchase.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">Frequently asked questions</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Got questions? Start here.</h2>
        </div>
        <div className="space-y-4">
          {[
            { question: "What is the TekRovia learning-to-placement journey?", answer: "A structured pathway that brings together learning, practice, interview preparation, and placement support. Your journey begins with registration and an assessment to identify a suitable starting level." },
            { question: "Is there a free trial?", answer: "Yes — three free sessions covering GenAI foundations, building a basic GenAI application, and an agentic AI demo with a personalised roadmap. No payment required." },
            { question: "Can I assess my skills before choosing a program?", answer: "Yes. The platform includes a career readiness assessment and an interactive technical assessment that helps you understand your starting point and receive a suggested learning route." },
            { question: "How much do the programs cost?", answer: "Technology Training, Interview Preparation and Placement Support are each ₹9,999. Corporate Soft Skills is ₹5,000. The Complete Package is ₹29,999. Confirm final pricing before purchasing." },
            { question: "Does placement support guarantee a job?", answer: "No. Placement support provides structured assistance — job matching, application support, interview coordination and feedback tracking. Employment depends on your preparation, employer decisions and available opportunities." },
            { question: "What happens after I enrol?", answer: "You receive LMS access, are added to a batch, assigned a support owner, and begin an orientation assessment. Your learning journey starts immediately." },
          ].map((item) => (
            <details key={item.question} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:border-indigo-400/40 open:bg-indigo-500/[0.04] sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-slate-100 marker:content-none">
                <span>{item.question}</span>
                <span aria-hidden="true" className="shrink-0 text-xl text-indigo-300 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 pr-6 text-sm leading-7 text-slate-400">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5 text-sm leading-7 text-slate-300 sm:p-6">
          <h3 className="font-semibold text-amber-200">Placement support disclaimer</h3>
          <p className="mt-2">TekRovia provides learning, interview preparation, and placement assistance. Participation does not guarantee an interview, job offer, salary, or employment outcome.</p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400">
            Get started →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TekRovia. All rights reserved.
        <span className="mx-3">·</span>
        <Link href="/trial" className="hover:text-slate-300">Free Trial</Link>
        <span className="mx-3">·</span>
        <Link href="/login" className="hover:text-slate-300">Login</Link>
      </footer>
    </main>
  );
}
