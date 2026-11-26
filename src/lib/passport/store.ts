import { z } from "zod";

import { COMPLIANCE_UNKNOWN } from "./compliance";
import type { PassportRecord } from "./types";

const KEY = "gsp.passports.v1";
const SHORTLIST_KEY = "gsp.shortlist.v1";

const text = (max: number) => z.string().max(max);

// Share links carry the passport inside them, so anything decoded is untrusted input.
const recordSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9-]{4,40}$/),
  createdAt: text(40),
  sample: z.literal(false),
  input: z.object({
    name: text(120),
    location: text(120),
    languages: z.array(text(40)).max(12),
    targetRole: text(120),
    background: text(3000),
    yearsExperience: z.number().min(0).max(60).nullable(),
    projects: z.array(z.object({ title: text(160), description: text(3000), link: text(300) })).max(5),
    evidenceUrl: text(300),
    // Links made before the readiness checklist existed carry no compliance block.
    compliance: z
      .object({
        id: z.enum(["unknown", "national", "refugee-id", "asylum", "none"]),
        work: z.enum(["unknown", "authorized", "remote-only", "pending", "none"]),
        payment: z.enum(["unknown", "bank", "mobile-money", "pending", "none"]),
      })
      .default(COMPLIANCE_UNKNOWN),
  }),
  evidence: z.discriminatedUnion("status", [
    z.object({ status: z.literal("none") }),
    z.object({ status: z.literal("link"), url: text(300) }),
    z.object({ status: z.literal("unreachable"), url: text(300), reason: text(300) }),
    z.object({
      status: z.literal("analyzed"),
      url: text(300),
      kind: z.enum(["repo", "account"]),
      fullName: text(200),
      description: text(600),
      languages: z.record(text(60), z.number().min(0)),
      topics: z.array(text(60)).max(20),
      stars: z.number().min(0),
      forks: z.number().min(0),
      repoCount: z.number().min(0),
      lastPush: text(40),
      hasReadme: z.boolean(),
      readmeSkills: z.array(text(40)).max(80),
      sample: z.boolean(),
    }),
  ]),
});

/** Validates a record from any untrusted place: a share link, device storage or the account. */
export function parseRecord(value: unknown): PassportRecord | null {
  const parsed = recordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function encodeRecord(record: PassportRecord): string {
  const bytes = new TextEncoder().encode(JSON.stringify(record));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeRecord(encoded: string): PassportRecord | null {
  try {
    const bin = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = recordSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function loadRecords(): PassportRecord[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((r) => {
      const parsed = recordSchema.safeParse(r);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

export function saveRecord(record: PassportRecord): void {
  const rest = loadRecords().filter((r) => r.id !== record.id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify([record, ...rest].slice(0, 30)));
  } catch {
    // Storage can be full or blocked; the share link still carries the passport.
  }
}

export function removeRecord(id: string): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(loadRecords().filter((r) => r.id !== id)));
  } catch {
    // nothing to do
  }
}

export function newPassportId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `GSP-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/** Sample passports live in the app; everyone else's travels inside the link itself. */
export function passportPath(record: PassportRecord): string {
  return record.sample ? `/passport/${record.id}` : `/passport/${record.id}#p=${encodeRecord(record)}`;
}

export function loadShortlist(): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(SHORTLIST_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveShortlist(ids: string[]): void {
  try {
    window.localStorage.setItem(SHORTLIST_KEY, JSON.stringify(ids));
  } catch {
    // nothing to do
  }
}

const VISIBILITY_KEY = "gsp.visibility.v1";

function readMap(key: string): Record<string, unknown> {
  try {
    const raw = JSON.parse(window.localStorage.getItem(key) ?? "{}") as unknown;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Public = listed in the Talent Explorer. Samples start public; a candidate's own passport starts private. */
export function isPublic(record: PassportRecord): boolean {
  const choice = readMap(VISIBILITY_KEY)[record.id];
  return typeof choice === "boolean" ? choice : record.sample;
}

export function setPublic(id: string, value: boolean): void {
  try {
    window.localStorage.setItem(VISIBILITY_KEY, JSON.stringify({ ...readMap(VISIBILITY_KEY), [id]: value }));
  } catch {
    // nothing to do
  }
}

const INTRO_KEY = "gsp.intros.v1";

export type IntroRequest = {
  passportId: string;
  candidate: string;
  from: string;
  organisation: string;
  email: string;
  kind: "intro" | "interview";
  message: string;
  sentAt: string;
};

export function loadIntroRequests(): IntroRequest[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(INTRO_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? (raw as IntroRequest[]).filter((r) => typeof r?.passportId === "string") : [];
  } catch {
    return [];
  }
}

export function saveIntroRequest(request: IntroRequest): IntroRequest[] {
  const next = [request, ...loadIntroRequests()].slice(0, 100);
  try {
    window.localStorage.setItem(INTRO_KEY, JSON.stringify(next));
  } catch {
    // nothing to do
  }
  return next;
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
