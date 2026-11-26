import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { listAccountRecords } from "@/lib/passport/cloud";
import { removeRecord, saveRecord } from "@/lib/passport/store";
import { safeRedirect } from "@/lib/safe-redirect";

/** Where to go after a Google round-trip, which always returns to the home page first. */
export const AFTER_AUTH_KEY = "gsp.afterAuth";

type AuthState = { user: User | null; ready: boolean };

const AuthContext = createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ user: null, ready: false });

  // The app's only auth listener: it feeds the header and refreshes data on real identity changes.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, ready: true });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  const userId = state.user?.id;
  useEffect(() => {
    if (!userId) return;
    // Bring the account's passports onto this device so every page can open them.
    listAccountRecords()
      .then((records) => [...records].reverse().forEach(saveRecord))
      .catch(() => undefined);
    try {
      const next = window.sessionStorage.getItem(AFTER_AUTH_KEY);
      if (next) {
        window.sessionStorage.removeItem(AFTER_AUTH_KEY);
        router.history.push(safeRedirect(next));
      }
    } catch {
      // Storage blocked: the person simply stays on the page they returned to.
    }
  }, [userId, router]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(async () => {
    await queryClient.cancelQueries();
    try {
      // Account passports should not stay behind on a shared device.
      (await listAccountRecords()).forEach((r) => removeRecord(r.id));
    } catch {
      // Offline: sign out anyway.
    }
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }, [queryClient, navigate]);
}
