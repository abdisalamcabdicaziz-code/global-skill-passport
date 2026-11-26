import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, GraduationCap, PenLine, ScanSearch, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CreatorCard } from "@/components/creator-card";
import { ClaimedTag, LevelMeter, ProfileCard, TrustRing, VerifiedTag } from "@/components/passport-ui";
import { Button } from "@/components/ui/button";
import { COMPLIANCE_READY_AT } from "@/lib/passport/compliance";
import { evaluate } from "@/lib/passport/evaluate";
import { SAMPLE_PASSPORTS } from "@/lib/passport/samples";
import { loadRecords } from "@/lib/passport/store";
import type { Passport } from "@/lib/passport/types";

const DESCRIPTION =
  "Skills speak when paperwork can't. Refugees and displaced professionals turn real projects into a verified, job-ready Skill Passport with compliance readiness and bridging steps.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Skill Passport: skills speak when paperwork can't" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Global Skill Passport: skills speak when paperwork can't" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    icon: PenLine,
    title: "Describe real work",
    text: "Projects you delivered, the tools you used and what changed. Add a repository or portfolio link, and say where you stand on ID, work authorisation and payment.",
  },
  {
    icon: ScanSearch,
    title: "Evidence is analysed",
    text: "One published rubric reads the case studies and repository. Skills and levels come only from that evidence, never from job titles or years stated.",
  },
  {
    icon: GraduationCap,
    title: "Close the gaps",
    text: "The passport lists bridging steps: recognition routes for regulated professions, micro-credentials for missing core skills, and what is needed to be hired and paid.",
  },
  {
    icon: FileSearch,
    title: "Share and get hired",
    text: "One link or one printed page. Employers filter by verified skill and readiness, shortlist, and request an introduction.",
  },
];

const GOALS = [
  ["SDG 4", "Quality education"],
  ["SDG 8", "Decent work"],
  ["SDG 10", "Reduced inequalities"],
  ["SDG 16", "Strong institutions"],
  ["SDG 17", "Partnerships"],
] as const;

function countryOf(location: string) {
  return location.split(",").pop()?.trim() ?? "";
}

function Index() {
  const featured = SAMPLE_PASSPORTS[0];
  // Passports made on this device join the count once the page is running in the browser.
  const [local, setLocal] = useState<Passport[]>([]);
  useEffect(() => setLocal(loadRecords().map(evaluate)), []);
  const metrics = useMemo(() => {
    const all = [...local, ...SAMPLE_PASSPORTS];
    const ready = all.filter((p) => p.compliance.score >= COMPLIANCE_READY_AT).length;
    return [
      { value: String(all.length), label: "Skill Passports issued", note: `${SAMPLE_PASSPORTS.length} samples + ${local.length} on this device` },
      { value: String(Math.round(all.reduce((a, p) => a + p.trust.score, 0) / all.length)), label: "Average Evidence Score", note: "Out of 100, same rubric for everyone" },
      { value: `${ready} of ${all.length}`, label: "Compliance-ready candidates", note: `Readiness ${COMPLIANCE_READY_AT}/100 or higher` },
      { value: String(new Set(all.map((p) => countryOf(p.record.input.location)).filter(Boolean)).size), label: "Host countries represented", note: "Where candidates live now" },
    ];
  }, [local]);
  return (
    <>
      <section className="cover-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <div className="animate-rise">
            <p className="eyebrow text-seal">Credential &amp; skills validation</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.08] text-balance sm:text-5xl lg:text-6xl">
              Skills speak when paperwork can&rsquo;t.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-cover-muted">
              Displaced professionals lose diplomas, licences and references. They do not lose what they can do. Build a passport from real work that an employer can inspect, with a clear path to being hired and paid.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="seal" size="lg">
                <Link to="/evaluate">
                  Create Your Skill Passport <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="onCover" size="lg">
                <Link to="/talent">
                  <Users aria-hidden /> Explore Vetted Talent
                </Link>
              </Button>
            </div>
          </div>

          {featured && (
            <Link
              to="/passport/$id"
              params={{ id: featured.record.id }}
              className="animate-rise block rounded-2xl bg-card p-5 text-card-foreground shadow-passport transition-transform hover:-translate-y-1 sm:p-6"
              style={{ animationDelay: "120ms" }}
              aria-label={`Open sample passport for ${featured.record.input.name}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow text-muted-foreground">Skill Passport · {featured.record.id}</p>
                  <p className="mt-2 truncate font-display text-2xl font-semibold">{featured.record.input.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {featured.record.input.targetRole} · {featured.record.input.location}
                  </p>
                </div>
                <TrustRing score={featured.trust.score} />
              </div>
              <ul className="mt-5 space-y-3 border-t pt-4">
                {featured.verifiedSkills.slice(0, 3).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{s.name}</span>
                    <LevelMeter level={s.level} />
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                <VerifiedTag>{featured.verifiedSkills.length} skills with evidence</VerifiedTag>
                <ClaimedTag>{featured.claimedSkills.length} self-reported</ClaimedTag>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="metrics" className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="metrics" className="text-2xl font-semibold">
              Impact right now
            </h2>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-verified motion-safe:animate-pulse" aria-hidden />
              Calculated live from the passports in this app
            </p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col-reverse rounded-xl border bg-background p-4 sm:p-5">
                <dt>
                  <span className="block font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{m.note}</span>
                </dt>
                <dd className="mb-2 font-display text-4xl font-semibold text-primary">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-semibold">From missing paperwork to job-ready, in four steps</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span className="font-mono text-sm text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/impact">
            Read the full rubric <ArrowRight aria-hidden />
          </Link>
        </Button>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-3xl font-semibold">Two kinds of information, never mixed</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Trust comes from being clear about what was checked and what was simply said.
            </p>
          </div>
          <div className="rounded-xl bg-verified-soft p-6">
            <ShieldCheck className="size-6 text-verified" aria-hidden />
            <h3 className="mt-3 text-xl font-semibold text-verified">Verified evidence</h3>
            <p className="mt-2">
              Skills found in analysed project case studies and in the contents of a public repository: languages used,
              README, activity. Each one links back to the sentence or file that supports it.
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-claimed/60 bg-claimed-soft p-6">
            <PenLine className="size-6 text-claimed" aria-hidden />
            <h3 className="mt-3 text-xl font-semibold text-claimed">Self-reported claims</h3>
            <p className="mt-2">
              Background, years of experience, languages, goals and the compliance checklist, as the candidate states
              them. Shown honestly, and never used to raise a proficiency level or the Evidence Score.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Sample passports</h2>
            <p className="mt-2 text-muted-foreground">Fictional profiles you can open, print and share right now.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/talent">
              See all profiles <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PASSPORTS.slice(1, 4).map((p) => (
            <ProfileCard key={p.record.id} passport={p} />
          ))}
        </div>

        <ul className="mt-12 flex flex-wrap gap-2" aria-label="Sustainable Development Goals supported">
          {GOALS.map(([code, name]) => (
            <li key={code} className="rounded-full border bg-card px-3 py-1.5 text-sm">
              <span className="font-mono font-semibold">{code}</span>{" "}
              <span className="text-muted-foreground">{name}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <CreatorCard headingId="creator-home" />
        </div>
      </section>
    </>
  );
}
