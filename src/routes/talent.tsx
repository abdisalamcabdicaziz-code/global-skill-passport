import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkCheck, FilePlus2, Search, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { IntroDialog, ProfileCard } from "@/components/passport-ui";
import { Button } from "@/components/ui/button";
import { evaluate } from "@/lib/passport/evaluate";
import { SAMPLE_PASSPORTS } from "@/lib/passport/samples";
import { isPublic, loadIntroRequests, loadRecords, loadShortlist, saveShortlist, type IntroRequest } from "@/lib/passport/store";
import type { Passport } from "@/lib/passport/types";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Search evidence-backed Skill Passports by verified skill, role, language, location and minimum Evidence Score and connect displaced professionals with real opportunities.";

export const Route = createFileRoute("/talent")({
  head: () => ({
    meta: [
      { title: "Talent Explorer | Global Skill Passport" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Talent Explorer for employers and partners" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TalentPage,
});

const countryOf = (location: string) => location.split(",").pop()?.trim() ?? "";
const uniqueSorted = (items: string[]) => [...new Set(items)].sort((a, b) => a.localeCompare(b));

function TalentPage() {
  const [all, setAll] = useState<Passport[]>(SAMPLE_PASSPORTS);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [role, setRole] = useState("");
  const [language, setLanguage] = useState("");
  const [country, setCountry] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [onlyShortlist, setOnlyShortlist] = useState(false);
  const [requests, setRequests] = useState<IntroRequest[]>([]);
  const [introFor, setIntroFor] = useState<Passport | null>(null);

  useEffect(() => {
    // Only passports their owner has switched to Public are listed.
    setAll([...loadRecords().map(evaluate), ...SAMPLE_PASSPORTS].filter((p) => isPublic(p.record)));
    setShortlist(loadShortlist());
    setRequests(loadIntroRequests());
  }, []);

  const skillOptions = useMemo(() => uniqueSorted(all.flatMap((p) => p.verifiedSkills.map((s) => s.name))), [all]);
  const roleOptions = useMemo(() => uniqueSorted(all.map((p) => p.roleFamily.label)), [all]);
  const countryOptions = useMemo(() => uniqueSorted(all.map((p) => countryOf(p.record.input.location)).filter(Boolean)), [all]);
  const languageOptions = useMemo(() => uniqueSorted(all.flatMap((p) => p.record.input.languages)), [all]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((p) => {
        const { input } = p.record;
        if (skill && !p.verifiedSkills.some((s) => s.name === skill)) return false;
        if (role && p.roleFamily.label !== role) return false;
        if (language && !input.languages.some((l) => l.toLowerCase() === language.toLowerCase())) return false;
        if (country && countryOf(input.location) !== country) return false;
        if (p.trust.score < minScore) return false;
        if (onlyShortlist && !shortlist.includes(p.record.id)) return false;
        if (!q) return true;
        const haystack = [input.name, input.targetRole, input.location, p.roleFamily.label, ...input.languages, ...p.verifiedSkills.map((s) => s.name)]
          .join(" ")
          .toLowerCase();
        return q.split(/\s+/).every((term) => haystack.includes(term));
      })
      .sort((a, b) => b.trust.score - a.trust.score);
  }, [all, query, skill, role, language, country, minScore, onlyShortlist, shortlist]);

  const toggleShortlist = (id: string) => {
    const next = shortlist.includes(id) ? shortlist.filter((x) => x !== id) : [...shortlist, id];
    setShortlist(next);
    saveShortlist(next);
  };

  const active = [
    skill && { label: `Skill: ${skill}`, clear: () => setSkill("") },
    role && { label: `Role: ${role}`, clear: () => setRole("") },
    language && { label: `Language: ${language}`, clear: () => setLanguage("") },
    country && { label: `Location: ${country}`, clear: () => setCountry("") },
    minScore > 0 && { label: `Evidence Score ${minScore}+`, clear: () => setMinScore(0) },
    query.trim() && { label: `“${query.trim()}”`, clear: () => setQuery("") },
    onlyShortlist && { label: "Shortlisted only", clear: () => setOnlyShortlist(false) },
  ].filter((x): x is { label: string; clear: () => void } => Boolean(x));

  const clearAll = () => {
    setQuery("");
    setSkill("");
    setRole("");
    setLanguage("");
    setCountry("");
    setMinScore(0);
    setOnlyShortlist(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow text-muted-foreground">For employers, mentors and partner organisations</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Talent Explorer</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Find people by what they have shown they can do. Skill filters match verified skills only, never self-reported
        claims.
      </p>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6 rounded-xl border bg-card p-4 sm:p-5">
        <label htmlFor="q" className="sr-only">
          Search by name, skill, role or location
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input id="q" type="search" className="field pl-9" placeholder="Search name, skill, role or location" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select id="skill" label="Verified skill" value={skill} onChange={setSkill} options={skillOptions} all="Any skill" />
          <Select id="role" label="Target role" value={role} onChange={setRole} options={roleOptions} all="Any role" />
          <Select id="language" label="Language" value={language} onChange={setLanguage} options={languageOptions} all="Any language" />
          <Select id="country" label="Location" value={country} onChange={setCountry} options={countryOptions} all="Any location" />
        </div>
        <div className="mt-4">
          <label htmlFor="minScore" className="flex items-baseline justify-between gap-3 text-sm font-medium">
            Minimum Evidence Score
            <output htmlFor="minScore" className="font-mono text-primary">
              {minScore === 0 ? "Any" : `${minScore}+`}
            </output>
          </label>
          <input id="minScore" type="range" min={0} max={90} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="mt-2 h-6 w-full accent-primary" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant={onlyShortlist ? "success" : "outline"} aria-pressed={onlyShortlist} onClick={() => setOnlyShortlist((v) => !v)}>
            <BookmarkCheck aria-hidden /> Shortlist ({shortlist.length})
          </Button>
          {active.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={f.clear}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm text-secondary-foreground hover:bg-secondary/70"
            >
              {f.label} <X className="size-3.5" aria-label="Remove filter" />
            </button>
          ))}
          {active.length > 1 && (
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-muted-foreground" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "profile" : "profiles"} · sorted by evidence score
      </p>

      {results.length > 0 ? (
        <ul className={cn("mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3")}>
          {results.map((p) => (
            <li key={p.record.id} className="animate-rise min-w-0">
              <ProfileCard passport={p} shortlisted={shortlist.includes(p.record.id)} onToggleShortlist={() => toggleShortlist(p.record.id)} onRequestIntro={() => setIntroFor(p)} requested={requests.some((r) => r.passportId === p.record.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed p-10 text-center">
          <p className="font-display text-xl font-semibold">No profiles match these filters</p>
          <p className="mt-2 text-muted-foreground">
            {onlyShortlist && shortlist.length === 0 ? "Your shortlist is empty. Shortlist a profile to keep it here." : "Try removing a filter or searching for a broader skill."}
          </p>
          <Button className="mt-5" variant="outline" onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      )}

      {requests.length > 0 && (
        <section aria-labelledby="requests" className="mt-10 rounded-xl border bg-card p-5">
          <h2 id="requests" className="flex items-center gap-2 text-xl font-semibold">
            <Send className="size-4" aria-hidden /> Requests ({requests.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Introductions and interviews you have asked for, kept on this device.</p>
          <ul className="mt-4 divide-y text-sm">
            {requests.map((r) => (
              <li key={r.sentAt} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <span>
                  <Link to="/passport/$id" params={{ id: r.passportId }} className="font-medium text-primary underline underline-offset-4">
                    {r.candidate}
                  </Link>{" "}
                  · {r.kind === "interview" ? "Interview" : "Introduction"} · from {r.organisation}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(r.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <IntroDialog passport={introFor} onClose={() => setIntroFor(null)} onSent={setRequests} />

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl bg-secondary/60 p-5 sm:flex-row sm:items-center">
        <p className="text-sm">
          Only passports switched to Public are listed. A passport you create starts Private: open it and choose
          &ldquo;Make public&rdquo; to list it here. Others reach you through links that candidates choose to share.
        </p>
        <Button asChild variant="primary" className="shrink-0">
          <Link to="/evaluate">
            <FilePlus2 aria-hidden /> Create a passport
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Select({ id, label, value, onChange, options, all }: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; all: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
