<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Skill evaluation is a pure function (`src/lib/passport/evaluate.ts`) of a `PassportRecord`; store and share only the record and re-evaluate on read. Why: share links stay small and scoring changes apply to every passport.
- Verified status and proficiency levels come only from project text and repository data, never from self-reported fields. Why: the product's trust depends on that separation; `evaluate.test.ts` guards it.
- Passports are stored as validated `PassportRecord`s in three places: localStorage, the share-link fragment (`#p=`), and, for signed-in users, the owner-only `passports` table via `src/lib/passport/cloud.ts`. Every read goes through `parseRecord`. Why: passports hold personal data and stay private until the candidate shares the link.
- Pages read passports from localStorage only; account passports are copied onto the device at sign-in and removed at sign-out (`src/lib/auth.tsx`). Why: one read path keeps the existing pages unchanged and leaves nothing behind on shared devices.
- Auth state comes from the single `onAuthStateChange` listener in `AuthProvider`; read it with `useAuth()`. Signed-in pages live under `src/routes/_authenticated/`. Why: extra listeners thrash the router and cache.
- `profiles.account_type` is a display label and must never gate access. Why: users can edit it themselves.
- Creator attribution is rendered from `src/lib/creator.ts`. Why: footer, Home and Impact cannot drift.
- Repository analysis runs in the browser against the public GitHub API. Why: each visitor gets their own anonymous rate limit.
- Compliance readiness (`src/lib/passport/compliance.ts`) is a separate self-declared score and never feeds the Evidence Score or skill levels. Why: no document is inspected, so it must not look verified; `evaluate.test.ts` guards it.
- Public/private visibility and intro requests are device-local settings keyed by passport id, not part of `PassportRecord`. Why: listing is not shared between users; share links must not carry listing state.
- The impact page renders the rubric from the constants the evaluator uses (`RUBRIC`, `*_OPTIONS`). Why: the published rubric cannot drift from the scoring.
