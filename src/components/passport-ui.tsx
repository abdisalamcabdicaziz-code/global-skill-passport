import { Link } from "@tanstack/react-router";
import { ArrowRight, Bookmark, BookmarkCheck, Check, CircleCheck, CircleDashed, CircleMinus, Languages, Link2, MapPin, PenLine, Send, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { LEVEL_ORDER } from "@/lib/passport/evaluate";
import { copyText, passportPath, saveIntroRequest, type IntroRequest } from "@/lib/passport/store";
import type { Level, Passport, PassportRecord, ReadyState } from "@/lib/passport/types";
import { cn } from "@/lib/utils";

export function TrustRing({ score, size = 72, onCover = false }: { score: number; size?: number; onCover?: boolean }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Evidence score ${score} out of 100`}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className={onCover ? "stroke-cover-foreground/15" : "stroke-muted"} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700", onCover ? "stroke-seal" : "stroke-verified")}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-lg font-semibold">{score}</span>
    </div>
  );
}

export function LevelMeter({ level }: { level: Level }) {
  const filled = LEVEL_ORDER.indexOf(level) + 1;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {LEVEL_ORDER.map((l, i) => (
          <span key={l} className={cn("h-2 w-4 rounded-sm", i < filled ? "bg-verified" : "bg-border")} />
        ))}
      </span>
      <span className="text-xs font-medium text-verified">{level}</span>
    </span>
  );
}

export function VerifiedTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-verified-soft px-2.5 py-1 text-xs font-medium text-verified">
      <ShieldCheck className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}

export function ClaimedTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-claimed/60 bg-claimed-soft px-2.5 py-1 text-xs font-medium text-claimed">
      <PenLine className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}

/** Link props that carry a non-sample passport inside the URL fragment. */
export function hashFor(record: PassportRecord): { hash?: string } {
  const hash = passportPath(record).split("#")[1];
  return hash ? { hash } : {};
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Copies the passport link and shows the confirmation in place for a moment. */
export function CopyLinkButton({
  record,
  size = "md",
  variant = "primary",
  label = "Copy Shareable Link",
  className,
}: {
  record: PassportRecord;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "seal";
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const onCopy = async () => {
    const ok = await copyText(window.location.origin + passportPath(record));
    setState(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  };

  return (
    <Button onClick={onCopy} size={size} variant={state === "copied" ? "success" : variant} className={className}>
      {state === "copied" ? <Check aria-hidden /> : <Link2 aria-hidden />}
      <span aria-live="polite">
        {state === "copied" ? "Link copied" : state === "failed" ? "Copy failed, try again" : label}
      </span>
    </Button>
  );
}

const READY_STYLE: Record<ReadyState, string> = {
  ready: "bg-verified-soft text-verified",
  partial: "border border-dashed border-claimed/60 bg-claimed-soft text-claimed",
  missing: "bg-muted text-muted-foreground",
};

/** A hire-and-pay readiness badge. The state is always spelled out, never shown by colour alone. */
export function ReadyBadge({ state, children }: { state: ReadyState; children: ReactNode }) {
  const Icon = state === "ready" ? CircleCheck : state === "partial" ? CircleDashed : CircleMinus;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", READY_STYLE[state])}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

export const complianceState = (score: number): ReadyState => (score >= 80 ? "ready" : score >= 50 ? "partial" : "missing");

/** Lets an employer or partner hub ask for an introduction. Requests are kept on this device. */
export function IntroDialog({
  passport,
  onClose,
  onSent,
}: {
  passport: Passport | null;
  onClose: () => void;
  onSent?: (all: IntroRequest[]) => void;
}) {
  const [from, setFrom] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<IntroRequest["kind"]>("intro");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<IntroRequest | null>(null);

  useEffect(() => {
    if (passport) {
      setSent(null);
      setError("");
      setMessage("");
    }
  }, [passport]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!passport) return;
    if (!from.trim() || !organisation.trim()) return setError("Enter your name and organisation.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter an email address the candidate can reply to.");
    const request: IntroRequest = {
      passportId: passport.record.id,
      candidate: passport.record.input.name,
      from: from.trim(),
      organisation: organisation.trim(),
      email: email.trim(),
      kind,
      message: message.trim(),
      sentAt: new Date().toISOString(),
    };
    const all = saveIntroRequest(request);
    setSent(request);
    onSent?.(all);
  };

  const name = passport?.record.input.name ?? "";
  return (
    <Dialog open={passport !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {sent ? (
          <>
            <DialogHeader>
              <span className="mb-2 grid size-12 place-items-center rounded-full bg-verified-soft text-verified">
                <CircleCheck className="size-6" aria-hidden />
              </span>
              <DialogTitle className="font-display text-2xl">Request recorded</DialogTitle>
              <DialogDescription>
                Your {sent.kind === "interview" ? "interview" : "introduction"} request for {sent.candidate} is saved
                under &ldquo;Requests&rdquo; in the Talent Explorer.
              </DialogDescription>
            </DialogHeader>
            <dl className="space-y-1 rounded-lg bg-muted/60 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Passport</dt>
                <dd className="font-mono">{sent.passportId}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">From</dt>
                <dd className="text-right break-words">
                  {sent.from}, {sent.organisation}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reply to</dt>
                <dd className="break-all">{sent.email}</dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">
              In this demonstration, requests stay on this device and no email is sent. In a live deployment a partner
              hub passes the request to the candidate, who decides whether to reply.
            </p>
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Request an intro to {name}</DialogTitle>
              <DialogDescription>The candidate sees who is asking and why before sharing any contact details.</DialogDescription>
            </DialogHeader>
            <div role="group" aria-label="Type of request" className="grid grid-cols-2 gap-1 rounded-md border p-1">
              {(["intro", "interview"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className={cn("min-h-9 rounded text-sm font-medium", kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {k === "intro" ? "Introduction" : "Interview"}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Your name
                <input className="field mt-1.5" autoComplete="name" maxLength={120} value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Organisation
                <input className="field mt-1.5" autoComplete="organization" maxLength={120} value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Work email
              <input className="field mt-1.5" type="email" autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Message <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea className="field mt-1.5 min-h-20" maxLength={600} placeholder="The role, whether it is remote, and what you would like to discuss." value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Send aria-hidden /> Send request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProfileCard({
  passport,
  shortlisted,
  onToggleShortlist,
  onRequestIntro,
  requested,
}: {
  passport: Passport;
  shortlisted?: boolean;
  onToggleShortlist?: () => void;
  onRequestIntro?: () => void;
  requested?: boolean;
}) {
  const { record, verifiedSkills, trust, compliance } = passport;
  const { input } = record;
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border bg-card p-5 shadow-passport transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <span className="cover-surface grid size-12 shrink-0 place-items-center rounded-lg font-display text-lg font-semibold">
          {initials(input.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold leading-tight">{input.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{input.targetRole}</p>
        </div>
        <TrustRing score={trust.score} size={52} />
      </div>

      <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">{input.location || "Location not given"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Languages className="size-4 shrink-0" aria-hidden />
          <dt className="sr-only">Languages</dt>
          <dd className="truncate">{input.languages.join(" · ") || "Languages not given"}</dd>
        </div>
      </dl>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Top verified skills">
        {verifiedSkills.slice(0, 4).map((s) => (
          <li key={s.id}>
            <VerifiedTag>{s.name}</VerifiedTag>
          </li>
        ))}
        {verifiedSkills.length === 0 && <li className="text-sm text-muted-foreground">No verified skills yet</li>}
      </ul>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <ReadyBadge state={complianceState(compliance.score)}>
          Compliance {compliance.score}/100 · {compliance.tier}
        </ReadyBadge>
        {passport.roleMatch !== null && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            {passport.roleMatch}% role match
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
        <Button asChild size="sm" className="flex-1">
          <Link to="/passport/$id" params={{ id: record.id }} {...hashFor(record)}>
            View passport <ArrowRight aria-hidden />
          </Link>
        </Button>
        {onToggleShortlist && (
          <Button
            size="sm"
            variant={shortlisted ? "success" : "outline"}
            onClick={onToggleShortlist}
            aria-pressed={shortlisted ?? false}
          >
            {shortlisted ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
            {shortlisted ? "Shortlisted" : "Shortlist"}
          </Button>
        )}
        {onRequestIntro && (
          <Button size="sm" variant={requested ? "outline" : "seal"} className="w-full" onClick={onRequestIntro}>
            {requested ? <Check aria-hidden /> : <Send aria-hidden />}
            {requested ? "Request sent · send another" : "Request Intro / Interview"}
          </Button>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {record.id} · {record.sample ? "Sample profile" : "Created on this device"}
      </p>
    </article>
  );
}
