import { Link } from "@tanstack/react-router";
import { BadgeCheck, CircleUserRound, FilePlus2, FolderGit2, Github, Home, LogOut, Mail, Scale, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth, useSignOut } from "@/lib/auth";
import { CREATOR } from "@/lib/creator";

const NAV = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/evaluate", label: "Create passport", short: "Create", icon: FilePlus2, exact: false },
  { to: "/talent", label: "Talent Explorer", short: "Talent", icon: Search, exact: false },
  { to: "/impact", label: "How It Works & Impact", short: "Impact", icon: Scale, exact: false },
] as const;

const footerLink = "inline-flex items-center gap-2 py-1 text-foreground underline-offset-4 hover:underline";
const mobileTab =
  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground data-[status=active]:text-primary";

export function SiteShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const signOut = useSignOut();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="no-print sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 rounded-md">
            <span className="cover-surface grid size-8 shrink-0 place-items-center rounded-md">
              <BadgeCheck className="size-4.5 text-seal" aria-hidden />
            </span>
            <span className="truncate font-display text-lg font-semibold leading-none">Global Skill Passport</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-secondary-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          {/* Rendered from the session so a successful login is visible straight away. */}
          <div className="flex shrink-0 items-center gap-2" aria-busy={!ready}>
            {!ready ? null : user ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link to="/account">
                    <CircleUserRound aria-hidden /> <span className="hidden sm:inline">My account</span>
                    <span className="sm:hidden">Account</span>
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={() => void signOut()}>
                  <LogOut aria-hidden /> Log out
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild size="sm" className="hidden min-[420px]:inline-flex">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Sign up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="no-print border-t bg-card pb-16 xl:pb-0">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-semibold">
              <BadgeCheck className="size-5 text-primary" aria-hidden /> Global Skill Passport
            </p>
            <p className="mt-3 text-muted-foreground">
              Evidence of practical skill for refugees and displaced professionals. It is not a degree, licence or
              identity document. Sample profiles are fictional.
            </p>
          </div>
          <nav aria-label="Platform">
            <h2 className="eyebrow text-muted-foreground">Platform</h2>
            <ul className="mt-3">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className={footerLink}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Account">
            <h2 className="eyebrow text-muted-foreground">Account</h2>
            <ul className="mt-3">
              {user ? (
                <li>
                  <Link to="/account" className={footerLink}>
                    My account
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link to="/auth" className={footerLink}>
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth" search={{ mode: "signup" }} className={footerLink}>
                      Sign up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          <div>
            <h2 className="eyebrow text-muted-foreground">Created &amp; built by</h2>
            <p className="mt-3 font-semibold">{CREATOR.name}</p>
            <ul className="mt-1">
              <li>
                <a href={`mailto:${CREATOR.email}`} className={`${footerLink} break-all`}>
                  <Mail className="size-4 shrink-0 text-primary" aria-hidden /> {CREATOR.email}
                </a>
              </li>
              <li>
                <a href={CREATOR.github} target="_blank" rel="noopener noreferrer" className={footerLink}>
                  <Github className="size-4 shrink-0 text-primary" aria-hidden /> GitHub profile
                </a>
              </li>
              <li>
                <a href={CREATOR.repo} target="_blank" rel="noopener noreferrer" className={footerLink}>
                  <FolderGit2 className="size-4 shrink-0 text-primary" aria-hidden /> Project repository
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
            © {new Date().getFullYear()} Global Skill Passport. Created and built by {CREATOR.name}.
          </p>
        </div>
      </footer>

      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
      >
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }} className={mobileTab}>
            <n.icon className="size-5" aria-hidden />
            {"short" in n ? n.short : n.label}
          </Link>
        ))}
        {user ? (
          <Link to="/account" className={mobileTab}>
            <CircleUserRound className="size-5" aria-hidden />
            Account
          </Link>
        ) : (
          <Link to="/auth" className={mobileTab}>
            <CircleUserRound className="size-5" aria-hidden />
            Log in
          </Link>
        )}
      </nav>
    </div>
  );
}
