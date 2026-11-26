import { detectSkillIds } from "./taxonomy";
import type { Evidence } from "./types";

/** Only http(s) links are ever rendered or fetched. */
export function safeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

async function gh(path: string, raw = false): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    return await fetch(`https://api.github.com${path}`, {
      signal: ctrl.signal,
      headers: { Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json" },
    });
  } finally {
    clearTimeout(timer);
  }
}

const reasonFor = (status: number) =>
  status === 404
    ? "GitHub could not find it. It may be private or misspelled."
    : status === 403 || status === 429
      ? "GitHub's hourly limit for anonymous checks was reached. Try again later."
      : `GitHub answered with an error (${status}).`;

type GhRepo = {
  full_name: string;
  description: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  language: string | null;
  size: number;
  fork: boolean;
};

/**
 * Reads what is publicly visible behind the candidate's link. GitHub repositories and
 * accounts are analysed live; any other link is recorded as provided-but-unread, because
 * a browser cannot read another site's pages.
 */
export async function analyzeEvidenceUrl(rawUrl: string): Promise<Evidence> {
  if (!rawUrl.trim()) return { status: "none" };
  const url = safeUrl(rawUrl);
  if (!url) return { status: "unreachable", url: rawUrl.trim().slice(0, 300), reason: "This does not look like a web address." };

  const parsed = new URL(url);
  if (parsed.hostname.replace(/^www\./, "") !== "github.com") return { status: "link", url };

  const [owner, repoRaw] = parsed.pathname.split("/").filter(Boolean);
  if (!owner) return { status: "link", url };
  const repo = repoRaw?.replace(/\.git$/, "");

  try {
    if (repo) {
      const res = await gh(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
      if (!res.ok) return { status: "unreachable", url, reason: reasonFor(res.status) };
      const data = (await res.json()) as GhRepo;
      const [langRes, readmeRes] = await Promise.all([
        gh(`/repos/${data.full_name}/languages`).catch(() => null),
        gh(`/repos/${data.full_name}/readme`, true).catch(() => null),
      ]);
      const languages = langRes?.ok ? ((await langRes.json()) as Record<string, number>) : {};
      const readme = readmeRes?.ok ? (await readmeRes.text()).slice(0, 20000) : "";
      return {
        status: "analyzed",
        url,
        kind: "repo",
        fullName: data.full_name,
        description: data.description ?? "",
        languages,
        topics: (data.topics ?? []).slice(0, 15),
        stars: data.stargazers_count,
        forks: data.forks_count,
        repoCount: 1,
        lastPush: data.pushed_at,
        hasReadme: readme.length > 0,
        readmeSkills: detectSkillIds(readme),
        sample: false,
      };
    }

    const res = await gh(`/users/${encodeURIComponent(owner)}/repos?per_page=30&sort=pushed`);
    if (!res.ok) return { status: "unreachable", url, reason: reasonFor(res.status) };
    const repos = ((await res.json()) as GhRepo[]).filter((r) => !r.fork);
    if (repos.length === 0) return { status: "unreachable", url, reason: "This account has no public repositories of its own." };
    const languages: Record<string, number> = {};
    for (const r of repos) if (r.language) languages[r.language] = (languages[r.language] ?? 0) + Math.max(1, r.size);
    const text = repos.map((r) => r.description ?? "").join(". ");
    return {
      status: "analyzed",
      url,
      kind: "account",
      fullName: owner,
      description: text.slice(0, 400),
      languages,
      topics: [...new Set(repos.flatMap((r) => r.topics ?? []))].slice(0, 15),
      stars: repos.reduce((a, r) => a + r.stargazers_count, 0),
      forks: repos.reduce((a, r) => a + r.forks_count, 0),
      repoCount: repos.length,
      lastPush: repos.map((r) => r.pushed_at).sort().at(-1) ?? new Date().toISOString(),
      hasReadme: false,
      readmeSkills: detectSkillIds(text),
      sample: false,
    };
  } catch {
    return { status: "unreachable", url, reason: "GitHub could not be reached. Check the connection and try again." };
  }
}
