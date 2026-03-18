"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import type { LoginResponse } from "@/types/auth";
import { AuthCard } from "./AuthCard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const LOGIN_API_V1 = process.env.NEXT_PUBLIC_LOGIN_API_V1 ?? "";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const from = searchParams.get("from");
  const redirectTo = from && from.startsWith("/") ? from : "/dashboard";
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}${LOGIN_API_V1}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": getOrCreateDeviceId(),
        },
        body: JSON.stringify({
          emailOrUsername: emailOrUsername.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? data?.error ?? `Sign in failed (${res.status})`);
        return;
      }
      const loginData = data as LoginResponse;
      login(loginData);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Use your email or username and password."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="emailOrUsername"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email or username
          </label>
          <input
            id="emailOrUsername"
            type="text"
            autoComplete="username"
            placeholder="you@example.com or yourname"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don’t have an account?{" "}
          <Link
            href={from ? `/auth/register?from=${encodeURIComponent(from)}` : "/auth/register"}
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
