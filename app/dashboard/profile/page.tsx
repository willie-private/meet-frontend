"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display mb-8 text-2xl font-bold text-[var(--foreground)]">
        Profile
      </h1>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-[var(--muted)]">
              Username
            </dt>
            <dd className="mt-1 text-[var(--foreground)]">{user.username}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--muted)]">Email</dt>
            <dd className="mt-1 text-[var(--foreground)]">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--muted)]">
              Email verified
            </dt>
            <dd className="mt-1 text-[var(--foreground)]">
              {user.email_verified ? "Yes" : "No"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
