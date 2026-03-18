"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/lib/authFetch";
import type { CreateMeetingResponse } from "@/types/meeting";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const MEETINGS_API_V1 = process.env.NEXT_PUBLIC_MEETINGS_API_V1 ?? "";

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const authFetch = useAuthFetch();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateMeeting() {
    if (!accessToken) return;
    setIsCreating(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}${MEETINGS_API_V1}`;
      const res = await authFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? data?.error ?? `Failed to create meeting (${res.status})`);
        return;
      }
      const { meeting } = data as CreateMeetingResponse;
      router.push(`/${meeting.identifier}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-40"
        aria-hidden
      >
        <div className="absolute -left-60 top-0 h-[500px] w-[500px] rounded-full bg-teal-400/25 blur-[120px]" />
        <div className="absolute -right-60 top-1/4 h-[450px] w-[450px] rounded-full bg-cyan-400/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[90px]" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.25em] text-[var(--accent)]">
          Welcome back, {user?.username}
        </p>
        <h1 className="font-display mb-4 text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl">
          Ready to meet?
        </h1>
        <p className="mb-12 max-w-md text-lg text-[var(--muted)]">
          One click. Instant meeting. Share the link with anyone—no account
          needed to join.
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={!accessToken || isCreating}
          className="group relative flex items-center gap-3 rounded-2xl bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-[var(--accent-foreground)] shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 dark:shadow-teal-400/20 dark:hover:shadow-teal-400/25"
          onClick={handleCreateMeeting}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 transition-colors group-hover:bg-white/30">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </span>
          {isCreating ? "Creating…" : "Create Meeting"}
        </button>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            HD video & audio
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500" />
            Share your screen
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-teal-500" />
            Instant join link
          </span>
        </div>
      </div>
    </div>
  );
}
