import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, FlaskConical, LoaderCircle, Plus, RotateCcw, ScanSearch, Trash2 } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { COMPLIANCE_UNKNOWN, ID_OPTIONS, PAYMENT_OPTIONS, WORK_OPTIONS } from "@/lib/passport/compliance";
import { analyzeEvidenceUrl, safeUrl } from "@/lib/passport/github";
import { SAMPLE_RECORDS, sampleEvidenceFor } from "@/lib/passport/samples";
import { useAuth } from "@/lib/auth";
import { saveToAccount } from "@/lib/passport/cloud";
import { newPassportId, passportPath, saveRecord } from "@/lib/passport/store";
import type { Compliance, PassportRecord, Project } from "@/lib/passport/types";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Enter your projects, target role and compliance readiness to generate a Skill Passport with an Evidence Score and bridging steps.";

export const Route = createFileRoute("/evaluate")({
  head: () => ({
    meta: [
      { title: "Create a Skill Passport | Global Skill Passport" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Create a Skill Passport" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvaluatePage,
});

type Form = {
  name: string;
  location: string;
  languages: string;
  targetRole: string;
  years: string;
  background: string;
  evidenceUrl: string;
  projects: Project[];
  compliance: Compliance;
};

const EMPTY_PROJECT: Project = { title: "", description: "", link: "" };
const EMPTY: Form = {
  name: "",
  location: "",
  languages: "",
  targetRole: "",
  years: "",
  background: "",
  evidenceUrl: "",
  projects: [{ ...EMPTY_PROJECT }],
  compliance: COMPLIANCE_UNKNOWN,
};

const STAGES = [
  "Reading project case studies",
  "Analysing repository or portfolio link",
  "Mapping skills and estimating levels",
  "Scoring compliance readiness and bridging steps",
  "Building the trust breakdown",
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function EvaluatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<number | null>(null);
  const [loadedSample, setLoadedSample] = useState<string | null>(null);
  const nextSample = useRef(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const busy = stage !== null;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setProject = (i: number, patch: Partial<Project>) =>
    setForm((f) => ({ ...f, projects: f.projects.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));

  const loadSample = (index: number) => {
    const s = SAMPLE_RECORDS[index % SAMPLE_RECORDS.length];
    if (!s) return;
    nextSample.current = index + 1;
    setForm({
      name: s.input.name,
      location: s.input.location,
      languages: s.input.languages.join(", "),
      targetRole: s.input.targetRole,
      years: s.input.yearsExperience?.toString() ?? "",
      background: s.input.background,
      evidenceUrl: s.input.evidenceUrl,
      projects: s.input.projects.map((p) => ({ ...p })),
      compliance: { ...s.input.compliance },
    });
    setErrors({});
    setLoadedSample(s.input.name);
  };

  const reset = () => {
    setForm({ ...EMPTY, projects: [{ ...EMPTY_PROJECT }] });
    setErrors({});
    setLoadedSample(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const languages = form.languages
      .split(/[,;\n]/)
      .map((l) => l.trim())
      .filter(Boolean);
    const projects = form.projects.filter((p) => p.title.trim() || p.description.trim());
    const next: Record<string, string> = {};
    if (!form.name.trim()) next["name"] = "Enter your name.";
    if (!form.location.trim()) next["location"] = "Enter where you live now.";
    if (languages.length === 0) next["languages"] = "Add at least one language.";
    if (!form.targetRole.trim()) next["targetRole"] = "Enter the role you are aiming for.";
    if (!projects.some((p) => p.description.trim().length >= 60))
      next["projects"] = "Describe at least one project in a few sentences (60 characters or more).";
    if (form.evidenceUrl.trim() && !safeUrl(form.evidenceUrl))
      next["evidenceUrl"] = "Enter a full web address starting with https://";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setStage(0);
    await wait(500);
    setStage(1);
    const url = form.evidenceUrl.trim();
    const [evidence] = await Promise.all([sampleEvidenceFor(url) ?? analyzeEvidenceUrl(url), wait(500)]);
    setStage(2);
    await wait(500);
    setStage(3);
    await wait(400);
    setStage(4);
    await wait(400);

    const years = Number.parseInt(form.years, 10);
    const record: PassportRecord = {
      id: newPassportId(),
      createdAt: new Date().toISOString(),
      sample: false,
      evidence,
      input: {
        name: form.name.trim(),
        location: form.location.trim(),
        languages,
        targetRole: form.targetRole.trim(),
        background: form.background.trim(),
        yearsExperience: Number.isFinite(years) && years >= 0 ? Math.min(years, 60) : null,
        evidenceUrl: url,
        compliance: form.compliance,
        projects: projects.map((p) => ({
          title: p.title.trim(),
          description: p.description.trim(),
          link: safeUrl(p.link) ?? "",
        })),
      },
    };
    saveRecord(record);
    // Signed-in people also keep it in their account; if that fails, the account page offers to save it again.
    if (user) await saveToAccount(user.id, record).catch(() => undefined);
    const hash = passportPath(record).split("#")[1];
    await navigate({ to: "/passport/$id", params: { id: record.id }, ...(hash ? { hash } : {}) });
  };

  const errorList = Object.values(errors);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow text-muted-foreground">Skill &amp; project evaluator</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Create your Skill Passport</h1>
      <p className="mt-3 text-muted-foreground">
        Describe what you have actually built, run or delivered. The more specific you are, the more your passport can
        show as evidence.
      </p>

      <section className="mt-6 rounded-xl border border-dashed border-primary/40 bg-secondary/50 p-4 sm:p-5" aria-label="Sample profiles">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">Just testing? Fill the form with a ready-made profile.</p>
          <Button variant="primary" size="sm" onClick={() => loadSample(nextSample.current)} disabled={busy}>
            <FlaskConical aria-hidden /> Load Sample Profile
          </Button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_RECORDS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => loadSample(i)}
                className={cn(
                  "rounded-full border bg-card px-3 py-1.5 text-left text-sm transition-colors hover:border-primary hover:bg-accent",
                  loadedSample === s.input.name && "border-primary bg-accent",
                )}
              >
                <span className="font-medium">{s.input.name.split(" ")[0]}</span>
                <span className="text-muted-foreground"> · {s.input.targetRole}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {loadedSample ? `Loaded ${loadedSample}. Edit anything, then generate the passport.` : "Sample profiles are fictional."}
        </p>
      </section>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-8">
        {errorList.length > 0 && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm"
          >
            <p className="font-semibold text-destructive">Please fix {errorList.length === 1 ? "this" : "these"} before continuing:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorList.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <fieldset className="space-y-4 rounded-xl border bg-card p-5 sm:p-6" disabled={busy}>
          <legend className="px-1 font-display text-xl font-semibold">About you</legend>
          <p className="text-sm text-claimed">These details are shown on your passport as self-reported.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" error={errors["name"]}>
              <input id="name" className="field" autoComplete="name" maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors["name"]} />
            </Field>
            <Field id="location" label="Current location / country" error={errors["location"]}>
              <input id="location" className="field" placeholder="Kakuma, Kenya" maxLength={120} value={form.location} onChange={(e) => set("location", e.target.value)} aria-invalid={!!errors["location"]} />
            </Field>
            <Field id="languages" label="Spoken languages" hint="Separate with commas" error={errors["languages"]}>
              <input id="languages" className="field" placeholder="Arabic, English, Turkish" maxLength={300} value={form.languages} onChange={(e) => set("languages", e.target.value)} aria-invalid={!!errors["languages"]} />
            </Field>
            <Field id="targetRole" label="Target role" error={errors["targetRole"]}>
              <input id="targetRole" className="field" placeholder="Data Analyst" maxLength={120} value={form.targetRole} onChange={(e) => set("targetRole", e.target.value)} aria-invalid={!!errors["targetRole"]} />
            </Field>
            <Field id="years" label="Years of experience" hint="Optional">
              <input id="years" className="field" inputMode="numeric" maxLength={2} value={form.years} onChange={(e) => set("years", e.target.value.replace(/\D/g, ""))} />
            </Field>
          </div>
          <Field id="background" label="Background and goals" hint="Optional. Education, past jobs, what you are looking for.">
            <textarea id="background" className="field min-h-28" maxLength={3000} value={form.background} onChange={(e) => set("background", e.target.value)} />
          </Field>
        </fieldset>

        <fieldset className="space-y-5 rounded-xl border bg-card p-5 sm:p-6" disabled={busy}>
          <legend className="px-1 font-display text-xl font-semibold">Projects and case studies</legend>
          <p className="text-sm text-verified">This is your evidence. Say what you did, which tools you used, for whom, and what changed. Numbers help.</p>
          {errors["projects"] && <p className="text-sm font-medium text-destructive">{errors["projects"]}</p>}
          {form.projects.map((p, i) => (
            <div key={i} className="space-y-3 rounded-lg border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Project {i + 1}</p>
                {form.projects.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => set("projects", form.projects.filter((_, j) => j !== i))}>
                    <Trash2 aria-hidden /> Remove
                  </Button>
                )}
              </div>
              <Field id={`p-title-${i}`} label="Title">
                <input id={`p-title-${i}`} className="field" maxLength={160} value={p.title} onChange={(e) => setProject(i, { title: e.target.value })} />
              </Field>
              <Field id={`p-desc-${i}`} label="What you did and what happened">
                <textarea id={`p-desc-${i}`} className="field min-h-36" maxLength={3000} value={p.description} onChange={(e) => setProject(i, { description: e.target.value })} aria-invalid={i === 0 && !!errors["projects"]} />
              </Field>
              <Field id={`p-link-${i}`} label="Link to this project" hint="Optional">
                <input id={`p-link-${i}`} className="field" inputMode="url" placeholder="https://" maxLength={300} value={p.link} onChange={(e) => setProject(i, { link: e.target.value })} />
              </Field>
            </div>
          ))}
          {form.projects.length < 4 && (
            <Button variant="outline" onClick={() => set("projects", [...form.projects, { ...EMPTY_PROJECT }])}>
              <Plus aria-hidden /> Add another project
            </Button>
          )}
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border bg-card p-5 sm:p-6" disabled={busy}>
          <legend className="px-1 font-display text-xl font-semibold">Repository or portfolio</legend>
          <Field
            id="evidenceUrl"
            label="GitHub repository or portfolio URL"
            hint="Optional. Public GitHub repositories and accounts are read live. Other links are attached for reviewers to open."
            error={errors["evidenceUrl"]}
          >
            <input id="evidenceUrl" className="field" inputMode="url" placeholder="https://github.com/your-name/your-project" maxLength={300} value={form.evidenceUrl} onChange={(e) => set("evidenceUrl", e.target.value)} aria-invalid={!!errors["evidenceUrl"]} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border bg-card p-5 sm:p-6" disabled={busy}>
          <legend className="px-1 font-display text-xl font-semibold">Compliance and payment readiness</legend>
          <p className="text-sm text-claimed">
            Employers need to know whether they can contract and pay you. Tell us where you stand: no documents are
            uploaded, the answers are shown as self-declared, and you can choose not to say.
          </p>
          <div className="grid gap-4">
            <Choice id="c-id" label="Identity / UNHCR documentation" value={form.compliance.id} options={ID_OPTIONS} onChange={(id) => set("compliance", { ...form.compliance, id })} />
            <Choice id="c-work" label="Work authorisation" value={form.compliance.work} options={WORK_OPTIONS} onChange={(work) => set("compliance", { ...form.compliance, work })} />
            <Choice id="c-pay" label="How you can be paid" value={form.compliance.payment} options={PAYMENT_OPTIONS} onChange={(payment) => set("compliance", { ...form.compliance, payment })} />
          </div>
        </fieldset>

        {busy ? (
          <div className="rounded-xl border bg-card p-5 sm:p-6" role="status" aria-live="polite">
            <p className="font-display text-xl font-semibold">Evaluating your evidence…</p>
            <ol className="mt-4 space-y-3">
              {STAGES.map((label, i) => (
                <li key={label} className={cn("flex items-center gap-3 text-sm", i > (stage ?? 0) && "text-muted-foreground")}>
                  <span className={cn("grid size-6 place-items-center rounded-full border", i < (stage ?? 0) && "border-verified bg-verified text-primary-foreground")}>
                    {i < (stage ?? 0) ? <Check className="size-3.5" aria-hidden /> : i === stage ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : null}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" className="flex-1">
              <ScanSearch aria-hidden /> Evaluate and generate passport
            </Button>
            <Button variant="outline" size="lg" onClick={reset}>
              <RotateCcw aria-hidden /> Clear form
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function Choice<V extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <Field id={id} label={label}>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value as V)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string | undefined; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p> : hint ? <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
