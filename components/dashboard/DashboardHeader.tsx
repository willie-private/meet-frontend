"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeSwitch } from "@/components/theme";

function getInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setOpen(false);
    logout();
    router.push("/auth/login");
  }

  if (!user) return null;

  const initials = getInitials(user.username);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="font-display text-xl font-bold tracking-tight text-[var(--foreground)]"
        >
          Meet
        </Link>

        <div className="flex items-center gap-3">
          <ThemeSwitch />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full outline-none ring-[var(--card-border)] focus:ring-2"
              aria-expanded={open}
              aria-haspopup="true"
              aria-label="Profile menu"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--accent-foreground)]"
                aria-hidden
              >
                {initials}
              </span>
              <span className="hidden text-left text-sm font-medium text-[var(--foreground)] sm:block">
                {user.username}
              </span>
              <svg
                className={`h-4 w-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {open && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-1 shadow-xl dark:shadow-2xl"
                role="menu"
              >
                <div className="border-b border-[var(--card-border)] px-4 py-3">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {user.username}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background)]"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
