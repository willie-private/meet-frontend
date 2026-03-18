import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth";
import { ThemeSwitch } from "@/components/theme";

function LoginFormFallback() {
  return (
    <div className="w-full max-w-sm animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
      <div className="mb-4 h-6 w-32 rounded bg-[var(--muted)]/30" />
      <div className="mb-4 h-4 w-48 rounded bg-[var(--muted)]/30" />
      <div className="mb-4 h-11 rounded bg-[var(--muted)]/30" />
      <div className="mb-4 h-11 rounded bg-[var(--muted)]/30" />
      <div className="h-11 rounded bg-[var(--muted)]/30" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4">
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <ThemeSwitch />
        <Link
          href="/"
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          ← Back to home
        </Link>
      </div>
      <div className="mb-6" />
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
