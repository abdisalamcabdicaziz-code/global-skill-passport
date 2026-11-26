import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { BadgeCheck, Briefcase, CircleAlert, MailCheck, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { GoogleButton } from "@/components/google-button";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { AFTER_AUTH_KEY, useAuth } from "@/lib/auth";
import { safeRedirect } from "@/lib/safe-redirect";
import { cn } from "@/lib/utils";

type AuthSearch = { mode?: "signup"; redirect?: string };

const DESCRIPTION = "Log in or create a free Global Skill Passport account to save and manage your Skill Passports securely.";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    ...(s["mode"] === "signup" ? { mode: "signup" as const } : {}),
    ...(typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Log in or sign up | Global Skill Passport" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Log in or sign up | Global Skill Passport" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ACCOUNT_TYPES = [
  { value: "candidate", label: "Candidate", note: "I want to prove my skills", icon: UserRound },
  { value: "partner", label: "Hiring partner", note: "I hire or support talent", icon: Briefcase },
] as const;

function AuthPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const { user, ready } = useAuth();
  const next = safeRedirect(search.redirect);
  const signup = search.mode === "signup";
  const [forgot, setForgot] = useState(false);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"candidate" | "partner">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<"confirm" | "reset" | null>(null);

  // Already signed in (or just signed in): leave the form.
  useEffect(() => {
    if (ready && user) router.history.replace(next);
  }, [ready, user, next, router]);

  useEffect(() => {
    setError(null);
    setSent(null);
  }, [signup, forgot]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!mail) return setError("Enter your email address.");
    if (!forgot && password.length < 8) return setError("Your password needs at least 8 characters.");
    if (signup && !forgot && !name.trim()) return setError("Enter your name.");
    setBusy(true);
    try {
      if (forgot) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(mail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) return setError(err.message);
        setSent("reset");
      } else if (signup) {
        const { data, error: err } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim().slice(0, 120), account_type: accountType },
          },
        });
        if (err) return setError(err.message);
        // Email confirmation is on, so there is no session until the link is clicked.
        if (!data.session) setSent("confirm");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (err) {
          return setError(
            err.message === "Invalid login credentials"
              ? "That email and password do not match. Check them and try again."
              : err.message,
          );
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      window.sessionStorage.setItem(AFTER_AUTH_KEY, next);
    } catch {
      // Storage blocked: the person lands on the home page instead.
    }
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setBusy(false);
      setError("Google sign-in did not complete. Please try again.");
    }
  };

  const title = forgot ? "Reset your password" : signup ? "Create your account" : "Welcome back";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-16 md:grid-cols-[0.9fr_1.1fr] md:items-start">
      <aside className="cover-surface hidden rounded-2xl p-8 md:block">
        <BadgeCheck className="size-8 text-seal" aria-hidden />
        <h2 className="mt-4 text-3xl font-semibold leading-tight">Your skills, saved in one secure place.</h2>
        <ul className="mt-6 space-y-3 text-cover-muted">
          <li>Save every Skill Passport to your account and open it on any device.</li>
          <li>Only you can see your saved passports until you share a link.</li>
          <li>Hiring partners keep one account for exploring vetted talent.</li>
        </ul>
      </aside>

      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {!forgot && (
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Account">
            {[
              { label: "Log in", active: !signup, mode: undefined },
              { label: "Sign up", active: signup, mode: "signup" as const },
            ].map((t) => (
              <Link
                key={t.label}
                to="/auth"
                search={{ ...(t.mode ? { mode: t.mode } : {}), ...(search.redirect ? { redirect: search.redirect } : {}) }}
                replace
                role="tab"
                aria-selected={t.active}
                className={cn(
                  "grid min-h-10 place-items-center rounded-md text-sm font-medium text-muted-foreground",
                  t.active && "bg-card text-foreground shadow-sm",
                )}
              >
                {t.label}
              </Link>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          {forgot
            ? "Enter your email and we will send you a link to choose a new password."
            : signup
              ? "Free for candidates and hiring partners."
              : "Log in to manage your saved Skill Passports."}
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-verified-soft p-5" role="status">
            <MailCheck className="size-6 text-verified" aria-hidden />
            <p className="mt-2 font-semibold">Check your email</p>
            <p className="mt-1 text-sm">
              {sent === "confirm"
                ? `We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`
                : `If an account exists for ${email.trim()}, a password reset link is on its way.`}
            </p>
          </div>
        ) : (
          <>
            {!forgot && (
              <>
                <div className="mt-6">
                  <GoogleButton onClick={google} disabled={busy}>
                    Continue with Google
                  </GoogleButton>
                </div>
                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or with email
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form onSubmit={submit} noValidate className={cn("space-y-4", forgot && "mt-6")}>
              {signup && !forgot && (
                <>
                  <label className="block text-sm font-medium">
                    Full name
                    <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} />
                  </label>
                  <fieldset>
                    <legend className="text-sm font-medium">I am joining as</legend>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                      {ACCOUNT_TYPES.map((t) => (
                        <label
                          key={t.value}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                            accountType === t.value && "border-primary bg-secondary",
                          )}
                        >
                          <input
                            type="radio"
                            name="account-type"
                            className="sr-only"
                            checked={accountType === t.value}
                            onChange={() => setAccountType(t.value)}
                          />
                          <t.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                          <span>
                            <span className="block text-sm font-semibold">{t.label}</span>
                            <span className="block text-xs text-muted-foreground">{t.note}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}
              <label className="block text-sm font-medium">
                Email
                <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
              </label>
              {!forgot && (
                <label className="block text-sm font-medium">
                  Password
                  <input
                    className={inputClass}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={signup ? "new-password" : "current-password"}
                  />
                  {signup && <span className="mt-1 block text-xs font-normal text-muted-foreground">At least 8 characters.</span>}
                </label>
              )}

              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : forgot ? "Send reset link" : signup ? "Create account" : "Log in"}
              </Button>
            </form>
          </>
        )}

        <div className="mt-5 text-sm">
          {forgot ? (
            <button type="button" className="font-medium text-primary underline underline-offset-4" onClick={() => setForgot(false)}>
              Back to log in
            </button>
          ) : (
            !signup && (
              <button type="button" className="font-medium text-primary underline underline-offset-4" onClick={() => setForgot(true)}>
                Forgot your password?
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
