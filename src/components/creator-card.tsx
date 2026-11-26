import { Github, Mail, FolderGit2 } from "lucide-react";

import { CREATOR } from "@/lib/creator";

const linkClass =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent break-all";

export function CreatorCard({ headingId }: { headingId: string }) {
  return (
    <section aria-labelledby={headingId} className="rounded-2xl border bg-card p-6 sm:p-8">
      <p className="eyebrow text-muted-foreground">Created &amp; built by</p>
      <h2 id={headingId} className="mt-2 text-2xl font-semibold sm:text-3xl">
        {CREATOR.name}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Global Skill Passport was designed and built by {CREATOR.name}. Employers, refugee hubs and partners who want
        to pilot it, contribute or ask a question are welcome to get in touch directly.
      </p>
      <ul className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <li>
          <a href={`mailto:${CREATOR.email}`} className={linkClass}>
            <Mail className="size-4 shrink-0 text-primary" aria-hidden /> {CREATOR.email}
          </a>
        </li>
        <li>
          <a href={CREATOR.github} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Github className="size-4 shrink-0 text-primary" aria-hidden /> GitHub profile
          </a>
        </li>
        <li>
          <a href={CREATOR.repo} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <FolderGit2 className="size-4 shrink-0 text-primary" aria-hidden /> Project repository
          </a>
        </li>
      </ul>
    </section>
  );
}
