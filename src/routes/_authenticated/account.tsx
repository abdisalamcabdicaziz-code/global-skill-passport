import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudUpload, FilePlus2, LogOut, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useSignOut } from "@/lib/auth";
import { deleteFromAccount, listAccountRecords, saveToAccount } from "@/lib/passport/cloud";
import { evaluate } from "@/lib/passport/evaluate";
import { loadRecords, passportPath, removeRecord, saveRecord } from "@/lib/passport/store";
import type { PassportRecord } from "@/lib/passport/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account | Global Skill Passport" },
      { name: "description", content: "Manage your saved Skill Passports and account details." },
      { property: "og:title", content: "My account | Global Skill Passport" },
      { property: "og:description", content: "Manage your saved Skill Passports and account details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type AccountType = "candidate" | "partner";

function PassportRow({ record, children }: { record: PassportRecord; children: ReactNode }) {
  const passport = useMemo(() => evaluate(record), [record]);
  const hash = passportPath(record).split("#")[1];
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">{record.input.name || "Unnamed passport"}</p>
        <p className="truncate text-sm text-muted-foreground">
          {record.input.targetRole} · Evidence Score {passport.trust.score}/100 · <span className="font-mono">{record.id}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/passport/$id" params={{ id: record.id }} {...(hash ? { hash } : {})}>
            Open
          </Link>
        </Button>
        {children}
      </div>
    </li>
  );
}

function AccountPage() {
  const { userId } = Route.useRouteContext();
  const { user } = useAuth();
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const passportsKey = ["passports", userId];

  const saved = useQuery({ queryKey: passportsKey, queryFn: listAccountRecords });
  const profile = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("display_name, account_type").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [device, setDevice] = useState<PassportRecord[]>([]);
  useEffect(() => {
    // Keep a device copy of everything in the account, then list what exists only here.
    saved.data?.forEach(saveRecord);
    setDevice(loadRecords());
  }, [saved.data]);
  const savedIds = new Set(saved.data?.map((r) => r.id));
  const deviceOnly = saved.data ? device.filter((r) => !savedIds.has(r.id)) : [];

  const upload = useMutation({
    mutationFn: (record: PassportRecord) => saveToAccount(userId, record),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: passportsKey }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteFromAccount(id);
      removeRecord(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: passportsKey }),
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("candidate");
  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.display_name);
    setType(profile.data.account_type === "partner" ? "partner" : "candidate");
  }, [profile.data]);
  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, display_name: name.trim().slice(0, 120), account_type: type, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">My account</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{profile.data?.display_name || "Welcome"}</h1>
          <p className="mt-1 truncate text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut aria-hidden /> Log out
        </Button>
      </div>

      <section aria-labelledby="saved" className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="saved" className="text-2xl font-semibold">
            Saved Skill Passports
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/evaluate">
                <FilePlus2 aria-hidden /> Create passport
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/talent">
                <Search aria-hidden /> Explore talent
              </Link>
            </Button>
          </div>
        </div>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verified" aria-hidden />
          Only you can see these. A passport is shown to someone else only when you send them its link.
        </p>

        {saved.isPending ? (
          <p className="mt-5 text-muted-foreground" role="status">
            Loading your passports…
          </p>
        ) : saved.isError ? (
          <p className="mt-5 text-destructive" role="alert">
            Your passports could not be loaded. Check your connection and reload the page.
          </p>
        ) : saved.data.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed p-5 text-muted-foreground">
            Nothing saved yet. Passports you create while logged in are saved here automatically.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {saved.data.map((r) => (
              <PassportRow key={r.id} record={r}>
                <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(r.id)}>
                  <Trash2 aria-hidden /> Delete
                </Button>
              </PassportRow>
            ))}
          </ul>
        )}

        {deviceOnly.length > 0 && (
          <>
            <h3 className="mt-8 text-lg font-semibold">On this device only</h3>
            <p className="mt-1 text-sm text-muted-foreground">Made here before you logged in. Save them to keep them with your account.</p>
            <ul className="mt-4 space-y-3">
              {deviceOnly.map((r) => (
                <PassportRow key={r.id} record={r}>
                  <Button size="sm" variant="secondary" disabled={upload.isPending} onClick={() => upload.mutate(r)}>
                    <CloudUpload aria-hidden /> Save to account
                  </Button>
                </PassportRow>
              ))}
            </ul>
          </>
        )}
        {(upload.isError || remove.isError) && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            That did not go through. Please try again.
          </p>
        )}
      </section>

      <section aria-labelledby="details" className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
        <h2 id="details" className="text-2xl font-semibold">
          Account details
        </h2>
        <form
          className="mt-5 max-w-md space-y-4"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            saveProfile.mutate();
          }}
        >
          <label className="block text-sm font-medium">
            Name
            <input
              className="mt-1.5 block min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              autoComplete="name"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium">Account type</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(
                [
                  ["candidate", "Candidate"],
                  ["partner", "Hiring partner"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "grid min-h-11 cursor-pointer place-items-center rounded-lg border px-3 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    type === value && "border-primary bg-secondary",
                  )}
                >
                  <input type="radio" name="type" className="sr-only" checked={type === value} onChange={() => setType(value)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Saving…" : "Save details"}
            </Button>
            <span className="text-sm text-muted-foreground" role="status">
              {saveProfile.isSuccess ? "Saved." : saveProfile.isError ? "Could not save. Try again." : ""}
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}
