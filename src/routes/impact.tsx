import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, Briefcase, GraduationCap, Handshake, IdCard, Landmark, Repeat, Scale, ShieldCheck } from "lucide-react";

import { CreatorCard } from "@/components/creator-card";
import { LevelMeter, ReadyBadge } from "@/components/passport-ui";
import { Button } from "@/components/ui/button";
import { COMPLIANCE_READY_AT, ID_OPTIONS, PAYMENT_OPTIONS, WORK_OPTIONS } from "@/lib/passport/compliance";
import { LEVEL_MEANING, LEVEL_ORDER, RUBRIC } from "@/lib/passport/evaluate";

const DESCRIPTION =
  "The open rubric behind every Skill Passport: how evidence is scored, how compliance readiness is assessed, bridging pathways, and alignment with SDGs 4, 8, 10, 16 and 17.";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "How It Works & Impact | Global Skill Passport" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "The rubric and global impact of Global Skill Passport" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImpactPage,
});

const CRITERIA = [
  {
    weight: "30%",
    title: "Credential & skills verification",
    icon: ShieldCheck,
    text: "Skills and levels are read from project case studies and live repository data, each with the quoted sentence or file behind it. Regulated professions get a recognition route instead of a false promise.",
  },
  {
    weight: "25%",
    title: "Access & compliance readiness",
    icon: IdCard,
    text: "Every passport tracks identity or UNHCR documentation, work authorisation and a payment pathway, and shows whether a local or a remote contract is likely to be possible.",
  },
  {
    weight: "20%",
    title: "Practical & market fit",
    icon: Briefcase,
    text: "Each target role maps to a set of core skills. The passport shows what share is evidenced, and employers filter by verified skill, role, language, location and minimum Evidence Score.",
  },
  {
    weight: "15%",
    title: "Sustainability & scalability",
    icon: Repeat,
    text: "One rule-based rubric scores every candidate the same way in seconds, with no reviewer in the loop and no server to run. A passport travels inside its own link.",
  },
  {
    weight: "10%",
    title: "Social & SDG impact",
    icon: Handshake,
    text: "Built for people whose paperwork did not survive displacement, and for the hubs, NGOs and employers who want to hire them fairly.",
  },
];

const PATHWAYS = [
  { area: "Recognition", text: "Nurses, engineers and teachers are pointed to the host country's council or board for competency assessment, with roles they can take in the meantime." },
  { area: "Skills", text: "Core skills for the target role that are missing from the evidence become a short micro-credential or a small project to complete and describe." },
  { area: "Evidence", text: "Where a passport leans on description alone, it asks for work samples, figures, or a reference from a supervisor or NGO partner." },
  { area: "Compliance", text: "Gaps in ID, work authorisation or payment turn into concrete onboarding steps a partner hub can help with." },
];

const SDGS = [
  { code: "SDG 4", name: "Quality education", text: "Recognises learning that happened outside classrooms and points each person to the next credential worth earning." },
  { code: "SDG 8", name: "Decent work", text: "Moves skilled people from informal work towards contracts they can be paid for, locally or remotely." },
  { code: "SDG 10", name: "Reduced inequalities", text: "Judges what someone can do, not which documents they managed to carry across a border." },
  { code: "SDG 16", name: "Strong institutions", text: "A published rubric, a clear line between evidence and claims, and no hidden scoring." },
  { code: "SDG 17", name: "Partnerships", text: "A shared format that refugee hubs, training providers and employers can all read and act on." },
];

const COMPLIANCE_GROUPS = [
  { title: "Identity / UNHCR documentation", icon: IdCard, max: 35, options: ID_OPTIONS },
  { title: "Work authorisation", icon: Landmark, max: 35, options: WORK_OPTIONS },
  { title: "Payment pathway", icon: Banknote, max: 30, options: PAYMENT_OPTIONS },
];

function ImpactPage() {
  return (
    <>
      <section className="cover-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="eyebrow text-seal">Rubric &amp; global impact guide</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-balance sm:text-5xl">How a passport is scored, and why it matters</h1>
          <p className="mt-4 max-w-2xl text-lg text-cover-muted">
            Nothing about the evaluation is hidden. This page is the full rubric, generated from the same rules the
            evaluator runs.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
        <section aria-labelledby="criteria">
          <h2 id="criteria" className="text-3xl font-semibold">
            Built against the PLP judging criteria
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CRITERIA.map((c) => (
              <li key={c.title} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <c.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-sm font-semibold text-primary">{c.weight}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rubric" className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 id="rubric" className="flex items-center gap-2 text-3xl font-semibold">
              <Scale className="size-6 text-primary" aria-hidden /> Evidence Score rubric
            </h2>
            <p className="mt-2 text-muted-foreground">100 points, the same for every candidate, sector and region.</p>
            <ol className="mt-6 space-y-4">
              {RUBRIC.map((r) => (
                <li key={r.label} className="rounded-xl border bg-card p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-sans text-base font-semibold">{r.label}</h3>
                    <span className="font-mono text-sm text-muted-foreground">{r.max} pts</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-verified" style={{ width: `${r.max}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.how}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Proficiency levels</h2>
            <p className="mt-2 text-muted-foreground">Set per skill, from evidence only. Years of experience never raise a level.</p>
            <dl className="mt-6 space-y-4">
              {LEVEL_ORDER.map((l) => (
                <div key={l} className="rounded-xl border bg-card p-4">
                  <dt>
                    <LevelMeter level={l} />
                  </dt>
                  <dd className="mt-2 text-sm text-muted-foreground">{LEVEL_MEANING[l]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="compliance">
          <h2 id="compliance" className="text-3xl font-semibold">
            Compliance and payment readiness
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            A separate 100-point score, so an employer can see at once whether someone can be contracted and paid. It
            is self-declared, never mixed into the Evidence Score, and a candidate may decline to answer.{" "}
            <ReadyBadge state="ready">Ready to hire and pay at {COMPLIANCE_READY_AT}+</ReadyBadge>
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {COMPLIANCE_GROUPS.map((g) => (
              <div key={g.title} className="rounded-xl border bg-card p-5">
                <g.icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-3 text-lg font-semibold">{g.title}</h3>
                <ul className="mt-3 divide-y text-sm">
                  {g.options
                    .filter((o) => o.value !== "unknown")
                    .map((o) => (
                      <li key={o.value} className="flex items-baseline justify-between gap-3 py-2">
                        <span>{o.label}</span>
                        <span className="shrink-0 font-mono text-muted-foreground">
                          {o.points}/{g.max}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="bridging">
          <h2 id="bridging" className="flex items-center gap-2 text-3xl font-semibold">
            <GraduationCap className="size-6 text-primary" aria-hidden /> Bridging and micro-credential pathways
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">Every passport ends with next steps drawn from its own gaps.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {PATHWAYS.map((p) => (
              <li key={p.area} className="rounded-xl border bg-card p-5">
                <p className="eyebrow text-muted-foreground">{p.area}</p>
                <p className="mt-2">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sdgs">
          <h2 id="sdgs" className="text-3xl font-semibold">
            Sustainable Development Goals
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SDGS.map((g) => (
              <li key={g.code} className="rounded-xl border bg-card p-5">
                <p className="font-mono text-sm font-semibold text-primary">{g.code}</p>
                <h3 className="mt-1 text-lg font-semibold">{g.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{g.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="limits" className="rounded-xl border border-dashed border-claimed/60 bg-claimed-soft p-6">
          <h2 id="limits" className="text-2xl font-semibold text-claimed">
            What a passport does not do
          </h2>
          <p className="mt-2 max-w-3xl">
            It does not confirm identity, inspect documents, prove who wrote a repository, or replace a licence. It
            tells an employer who is worth interviewing and what to ask, and tells a candidate what to do next.
          </p>
        </section>

        <CreatorCard headingId="creator-impact" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/evaluate">
              Create Your Skill Passport <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/talent">Explore Vetted Talent</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
