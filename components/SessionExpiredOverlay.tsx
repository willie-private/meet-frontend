"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * When refresh fails, we set sessionExpired (user stays on page).
 * This overlay appears and only redirects to login when the user clicks "Sign in again".
 */
export function SessionExpiredOverlay() {
  const router = useRouter();
  const { sessionExpired, logout, setSessionExpired } = useAuth();

  if (!sessionExpired) return null;

  function handleSignIn() {
    setSessionExpired(false);
    logout();
    router.replace("/auth/login");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl">
        <h2
          id="session-expired-title"
          className="text-lg font-semibold text-white"
        >
          Session expired
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Your session has expired. Please sign in again to continue.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
        >
          Sign in again
        </button>
      </div>
    </div>
  );
}
