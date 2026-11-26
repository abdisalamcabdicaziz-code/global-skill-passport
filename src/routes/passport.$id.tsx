import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  GitBranch,
  GraduationCap,
  Info,
  Languages,
  MapPin,
  Printer,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ClaimedTag, complianceState, CopyLinkButton, IntroDialog, LevelMeter, ReadyBadge, TrustRing, VerifiedTag } from "@/components/passport-ui";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { deleteFromAccount } from "@/lib/passport/cloud";
import { evaluate, LEVEL_MEANING, LEVEL_ORDER } from "@/lib/passport/evaluate";
import { safeUrl } from "@/lib/passport/github";
import { findSample } from "@/lib/passport/samples";
import { decodeRecord, isPublic, loadRecords, passportPath, removeRecord, setPublic } from "@/lib/passport/store";
import type { Passport, PassportRecord } from "@/lib/passport/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/passport/$id")({
  head: ({ params }) => {
    const sample = findSample(params.id);
    const title = sample
      ? `${sample.record.input.name}, ${sample.record.input.targetRole} | Skill Passport`
      : "Skill Passport | Global Skill Passport";
    const description = sample
      ? `Evidence-based Skill Passport for ${sample.record.input.name}: ${sample.verifiedSkills.length} verified skills, evidence score ${sample.trust.score}/100.`
      : "An evidence-based Skill Passport separating verified skills from self-reported claims.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        // Shared passports hold personal details; only the fictional samples should be indexed.
        ...(sample ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: PassportPage,
});

function PassportPage() {
  const { id } = Route.useParams();
  const sample = findSample(id);
  // Non-sample passports live in the link fragment or on this device, so they load after hydration.
  const [local, setLocal] = useState<{ record: PassportRecord | null; owned: boolean } | "loading">("loading");

  useEffect(() => {
    if (sample) return;
    const stored = loadRecords().find((r) => r.id === id) ?? null;
    const fromHash = window.location.hash.startsWith("#p=") ? decodeRecord(window.location.hash.slice(3)) : null;
    setLocal({ record: stored ?? fromHash, owned: stored !== null });
  }, [id, sample]);

  const passport = useMemo(
    () => sample ?? (local !== "loading" && local.record ? evaluate(local.record) : null),
    [sample, local],
  );

  if (!passport) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        {local === "loading" ? (
          <p className="text-muted-foreground" role="status">
            Opening passport…
          </p>
        ) : (
          <>
            <h1 className="text-3xl font-semibold">This passport could not be opened</h1>
            <p className="mt-3 text-muted-foreground">
              The link may be incomplete. Ask the candidate to copy the passport link again and send the whole address.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/talent">Browse talent</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/evaluate">Create a passport</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return <PassportView passport={passport} owned={local !== "loading" && local.owned} />;
}

function PassportView({ passport, owned }: { passport: Passport; owned: boolean }) {
  const [view, setView] = useState<"full" | "summary">("full");
  const [deleted, setDeleted] = useState(false);
  const { user } = useAuth();
  const [listed, setListed] = useState(passport.record.sample);
  const [introOpen, setIntroOpen] = useState(false);
  useEffect(() => setListed(isPublic(passport.record)), [passport.record]);
  const canToggle = owned || passport.record.sample;
  const { record, verifiedSkills, claimedSkills, trust } = passport;
  const { input, evidence } = record;
  const summary = view === "summary";
  const skills = summary ? verifiedSkills.slice(0, 6) : verifiedSkills;
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => setShareUrl(window.location.origin + passportPath(record)), [record]);
  const evidenceLink = evidence.status === "none" ? null : safeUrl(evidence.url);

  return (
    <div className="print-tight mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/talent">
            <ArrowLeft aria-hidden /> Talent Explorer
          </Link>
        </Button>
        <div role="group" aria-label="Passport view" className="inline-flex rounded-md border bg-card p-1">
          {(["full", "summary"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "min-h-9 rounded px-3 text-sm font-medium capitalize transition-colors",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "full" ? "Full passport" : "Summary"}
            </button>
          ))}
        </div>
      </div>

      <article className="animate-rise overflow-hidden rounded-2xl border bg-card shadow-passport print:rounded-none print:border-0 print:shadow-none">
        <header className="cover-surface p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-seal">Global Skill Passport{record.sample ? " · Sample profile" : ""}</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight break-words sm:text-4xl">{input.name}</h1>
              <p className="mt-1 text-lg text-cover-muted">{input.targetRole}</p>
            </div>
            <div className="text-center">
              <TrustRing score={trust.score} size={84} onCover />
              <p className="mt-1.5 max-w-24 text-xs text-cover-muted">{trust.tier}</p>
            </div>
          </div>
          <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-seal" aria-hidden />
              <dt className="sr-only">Location</dt>
              <dd>{input.location}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Languages className="size-4 shrink-0 text-seal" aria-hidden />
              <dt className="sr-only">Languages</dt>
              <dd>{input.languages.join(" · ")}</dd>
            </div>
            <div className="font-mono text-xs text-cover-muted">
              <dt className="inline">Passport no. </dt>
              <dd className="inline text-cover-foreground">{record.id}</dd>
            </div>
            <div className="font-mono text-xs text-cover-muted">
              <dt className="inline">Issued </dt>
              <dd className="inline text-cover-foreground">
                {new Date(record.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
              </dd>
            </div>
          </dl>
        </header>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/50 px-5 py-3 text-sm sm:px-8">
          <span className="font-medium">How to read this:</span>
          <VerifiedTag>Verified evidence</VerifiedTag>
          <ClaimedTag>Self-reported claim</ClaimedTag>
        </div>

        <div className="space-y-10 p-5 sm:p-8">
          <Section title="Verified skills" note={`${verifiedSkills.length} skills found in analysed projects and repository data`}>
            {skills.length === 0 ? (
              <p className="text-muted-foreground">No skills could be confirmed from the evidence provided yet.</p>
            ) : (
              <ul className={cn("grid gap-3", summary && "sm:grid-cols-2")}>
                {skills.map((s) => (
                  <li key={s.id} className="print-avoid-break rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.category} ·{" "}
                          {s.source === "both" ? "Repository + project" : s.source === "repository" ? "Repository" : "Project case study"}
                        </p>
                      </div>
                      <LevelMeter level={s.level} />
                    </div>
                    {!summary && (
                      <ul className="mt-3 space-y-1.5 border-l-2 border-verified/40 pl-3 text-sm text-muted-foreground">
                        {s.evidence.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {summary && verifiedSkills.length > skills.length && (
              <p className="mt-3 text-sm text-muted-foreground">+ {verifiedSkills.length - skills.length} more in the full passport</p>
            )}
            {!summary && (
              <details className="no-print mt-4 rounded-lg bg-muted/60 p-4 text-sm">
                <summary className="cursor-pointer font-medium">What the levels mean</summary>
                <dl className="mt-3 space-y-2">
                  {LEVEL_ORDER.map((l) => (
                    <div key={l} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <dt className="sm:w-44">
                        <LevelMeter level={l} />
                      </dt>
                      <dd className="text-muted-foreground">{LEVEL_MEANING[l]}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </Section>

          <Section title="Highlighted projects" note="Summarised from the candidate's case studies">
            <ul className="grid gap-4">
              {(summary ? passport.projects.slice(0, 2) : passport.projects).map((p) => {
                const link = safeUrl(p.link);
                return (
                  <li key={p.title} className="print-avoid-break rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold">{p.title}</h3>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                        {p.strength} detail
                      </span>
                    </div>
                    <p className={cn("mt-2 text-sm", summary && "line-clamp-2")}>{p.summary}</p>
                    {!summary && (
                      <>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {p.skills.map((s) => (
                            <li key={s}>
                              <VerifiedTag>{s}</VerifiedTag>
                            </li>
                          ))}
                        </ul>
                        {p.signals.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{p.signals.join(" · ")}</p>}
                        {link && (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 break-all">
                            <ExternalLink className="size-4 shrink-0" aria-hidden /> {link}
                          </a>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>

          {!summary && passport.strengths.length > 0 && (
            <Section title="Real-world strengths" note="Patterns in how this person works">
              <ul className="grid gap-3 sm:grid-cols-2">
                {passport.strengths.map((s) => (
                  <li key={s.title} className="print-avoid-break rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{s.title}</p>
                      {s.basis === "evidence" ? <VerifiedTag>From evidence</VerifiedTag> : <ClaimedTag>Self-reported</ClaimedTag>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <section aria-labelledby="compliance" className="print-avoid-break rounded-xl border border-dashed border-claimed/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="compliance" className="text-2xl font-semibold">
                  Compliance and payment readiness
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Can this person be contracted and paid? Declared by the candidate; documents were not inspected.</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="font-mono text-2xl font-semibold">
                  {passport.compliance.score}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
                <ReadyBadge state={complianceState(passport.compliance.score)}>{passport.compliance.tier}</ReadyBadge>
              </div>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {passport.compliance.items.map((item) => (
                <li key={item.key} className="rounded-lg border bg-background p-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                  <p className="mt-1.5 text-sm font-medium">{item.status}</p>
                  <p className="mt-2">
                    <ReadyBadge state={item.state}>
                      {item.state === "ready" ? "Ready" : item.state === "partial" ? "In progress" : "Not ready"} · {item.points}/{item.max}
                    </ReadyBadge>
                  </p>
                </li>
              ))}
            </ul>
            <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {([["Local employment contract", passport.compliance.local], ["Remote / freelance contract", passport.compliance.remote]] as const).map(([label, e]) => (
                <li key={label} className="rounded-lg bg-muted/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{label}</span>
                    <ReadyBadge state={e.state}>{e.state === "ready" ? "Likely eligible" : e.state === "partial" ? "Nearly eligible" : "Not yet eligible"}</ReadyBadge>
                  </div>
                  {!summary && <p className="mt-1.5 text-muted-foreground">{e.note}</p>}
                </li>
              ))}
            </ul>
            {!summary && <p className="mt-3 text-xs text-muted-foreground">Indicative only. Rules differ by country; confirm documents during onboarding.</p>}
          </section>

          {passport.bridging.length > 0 && (
            <Section title="Bridging and upskilling recommendations" note="Next steps that would strengthen this passport">
              <ol className="grid gap-3">
                {(summary ? passport.bridging.slice(0, 3) : passport.bridging).map((b) => (
                  <li key={b.title} className="print-avoid-break flex gap-3 rounded-lg border p-4">
                    <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{b.area}</p>
                      <p className="mt-0.5 font-semibold">{b.title}</p>
                      {!summary && <p className="mt-1 text-sm text-muted-foreground">{b.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          <Section title="Work readiness notes" note={passport.roleMatch === null ? "For hiring managers and mentors" : `For hiring managers and mentors · ${passport.roleMatch}% of core ${passport.roleFamily.label} skills evidenced`}>
            <ul className="space-y-3">
              {(summary ? passport.readiness.slice(0, 3) : passport.readiness).map((n) => (
                <li key={n.text} className="flex gap-3 text-sm">
                  {n.tone === "ready" ? (
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-verified" aria-label="Ready:" />
                  ) : n.tone === "gap" ? (
                    <CircleAlert className="mt-0.5 size-5 shrink-0 text-claimed" aria-label="Gap:" />
                  ) : (
                    <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-label="Note:" />
                  )}
                  <span>{n.text}</span>
                </li>
              ))}
            </ul>
          </Section>

          {!summary && (
            <section aria-labelledby="claims" className="print-avoid-break rounded-xl border border-dashed border-claimed/60 bg-claimed-soft p-5">
              <h2 id="claims" className="text-2xl font-semibold text-claimed">
                Self-reported claims
              </h2>
              <p className="mt-1 text-sm">Stated by the candidate. Not checked, and not used to set any skill level.</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <Claim label="Location">{input.location}</Claim>
                <Claim label="Languages">{input.languages.join(", ")}</Claim>
                <Claim label="Target role">{input.targetRole}</Claim>
                <Claim label="Experience">{input.yearsExperience ? `${input.yearsExperience} years` : "Not stated"}</Claim>
                <Claim label="Compliance checklist">{passport.compliance.items.map((i) => i.status).join(" · ")}</Claim>
                {input.background && (
                  <div className="sm:col-span-2">
                    <Claim label="Background and goals">{input.background}</Claim>
                  </div>
                )}
              </dl>
              {claimedSkills.length > 0 && (
                <>
                  <p className="mt-4 text-sm font-medium">Skills mentioned without supporting evidence</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {claimedSkills.map((c) => (
                      <li key={c.id}>
                        <ClaimedTag>{c.name}</ClaimedTag>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          <Section title="Verification and trust breakdown" note={`Evidence score ${trust.score} out of 100 · ${trust.tier}`}>
            <ul className="space-y-4">
              {trust.components.map((c) => (
                <li key={c.label} className="print-avoid-break">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {c.score}/{c.max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-verified transition-[width] duration-700" style={{ width: `${(c.score / c.max) * 100}%` }} />
                  </div>
                  {!summary && <p className="mt-1.5 text-sm text-muted-foreground">{c.note}</p>}
                </li>
              ))}
            </ul>

            {!summary && evidence.status === "analyzed" && (
              <div className="print-avoid-break mt-6 rounded-lg border p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <GitBranch className="size-4" aria-hidden /> {evidence.fullName}
                  {evidence.sample && <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-normal">sample data</span>}
                </p>
                {evidence.description && <p className="mt-1 text-sm text-muted-foreground">{evidence.description}</p>}
                <LanguageBar languages={evidence.languages} />
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  {evidence.kind === "account" ? `${evidence.repoCount} repositories · ` : ""}
                  {evidence.stars} stars · {evidence.forks} forks · last activity{" "}
                  {new Date(evidence.lastPush).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}
                </p>
              </div>
            )}
            {!summary && evidenceLink && (
              <a href={evidenceLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 break-all">
                <ExternalLink className="size-4 shrink-0" aria-hidden /> {evidenceLink}
              </a>
            )}
            {!summary && (
              <p className="mt-5 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">What this does and does not confirm.</strong> The analysis reads the
                candidate&rsquo;s project descriptions and public repository contents. It does not confirm identity,
                authorship of a repository, or formal qualifications. Use it to decide who to interview, and ask about
                the evidence quoted above.
              </p>
            )}
          </Section>

          <footer className="border-t pt-5 text-xs text-muted-foreground">
            <p className="font-mono break-all">
              {record.id} · {shareUrl ? shareUrl.split("#")[0] : "globalskillpassport"}
            </p>
          </footer>
        </div>
      </article>

      <div className="no-print mt-6 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Share this passport</h2>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", listed ? "bg-verified-soft text-verified" : "bg-muted text-muted-foreground")} role="status">
            {listed ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
            {listed ? "Public" : "Private"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {listed
            ? "Public: listed in the Talent Explorer on this device, and open to anyone you send the link to."
            : canToggle
              ? "Private: not listed in the Talent Explorer. Only people you send the link to can open it."
              : "You opened this passport from a link the candidate shared with you."}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <CopyLinkButton record={record} size="lg" />
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <Printer aria-hidden /> Print / Save as PDF
          </Button>
          {canToggle && (
            <Button
              variant="outline"
              size="lg"
              aria-pressed={listed}
              onClick={() => {
                setPublic(record.id, !listed);
                setListed(!listed);
              }}
            >
              {listed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {listed ? "Make private" : "Make public"}
            </Button>
          )}
          <Button variant="seal" size="lg" onClick={() => setIntroOpen(true)}>
            <Send aria-hidden /> Request Intro / Interview
          </Button>
        </div>
        <IntroDialog passport={introOpen ? passport : null} onClose={() => setIntroOpen(false)} />
        <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/evaluate">
              <FilePlus2 aria-hidden /> Create another passport
            </Link>
          </Button>
          {owned && !deleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                removeRecord(record.id);
                if (user) void deleteFromAccount(record.id).catch(() => undefined);
                setDeleted(true);
              }}
            >
              <Trash2 aria-hidden /> {user ? "Delete from my account and this device" : "Remove from this device"}
            </Button>
          )}
          {deleted && (
            <p className="self-center text-sm text-muted-foreground" role="status">
              Removed. Links you already shared still work.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}

function Claim({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-widest text-claimed">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}

function LanguageBar({ languages }: { languages: Record<string, number> }) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (total === 0) return null;
  const tones = ["bg-primary", "bg-verified", "bg-seal", "bg-claimed", "bg-cover"];
  return (
    <div className="mt-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        {entries.map(([name, v], i) => (
          <span key={name} className={tones[i]} style={{ width: `${(v / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {entries.map(([name, v], i) => (
          <li key={name} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", tones[i])} aria-hidden />
            {name} <span className="text-muted-foreground">{Math.round((v / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
