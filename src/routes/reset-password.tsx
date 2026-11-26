import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | Global Skill Passport" },
      { name: "description", content: "Set a new password for your Global Skill Passport account." },
      { property: "og:title", content: "Choose a new password | Global Skill Passport" },
      { property: "og:description", content: "Set a new password for your Global Skill Passport account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Your password needs at least 8 characters.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    await navigate({ to: "/account", replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold">Choose a new password</h1>
        {!ready ? (
          <p className="mt-4 text-muted-foreground" role="status">
            Checking your reset link…
          </p>
        ) : !user ? (
          <>
            <p className="mt-3 text-muted-foreground">This reset link has expired or was already used. Request a new one from the log in page.</p>
            <Button asChild className="mt-6">
              <Link to="/auth">Back to log in</Link>
            </Button>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              New password
              <input
                className="mt-1.5 block min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">At least 8 characters.</span>
            </label>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
