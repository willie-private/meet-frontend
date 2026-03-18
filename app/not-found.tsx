"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MeetingLayout from "@/app/[identifier]/layout";
import { JoinMeetingScreen } from "@/components/JoinMeetingScreen";

// Single path segment (e.g. /snt-euz-vsf) = meeting ID. Static export only pre-renders one; others hit 404.
const MEETING_ID_RE = /^\/[^/]+$/;
const RESERVED_SEGMENTS = new Set(["auth", "dashboard", "_next"]);

/**
 * Static export: /[id] only pre-renders one path. Other IDs hit 404.
 * We use window.location.pathname after mount because on 404.html the router pathname
 * can be /_not-found, which would wrongly show the generic 404 for meeting URLs.
 */
export default function NotFound() {
  const pathname = usePathname();
  const [clientPath, setClientPath] = useState<string | null>(null);

  useEffect(() => {
    setClientPath(window.location.pathname);
  }, []);

  const pathToCheck = clientPath ?? pathname;
  const segment = pathToCheck?.replace(/^\/|\/$/g, "").split("/")[0];
  const isMeetingId =
    pathToCheck?.match(MEETING_ID_RE) &&
    segment &&
    !RESERVED_SEGMENTS.has(segment);

  if (isMeetingId && segment) {
    return (
      <MeetingLayout>
        <JoinMeetingScreen identifier={segment} />
      </MeetingLayout>
    );
  }

  // Brief loading so we don't flash 404 when the real URL is a meeting link
  if (clientPath === null && (pathname === "/_not-found" || pathname === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] text-[var(--foreground)]">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-[var(--muted-foreground)]">
        This page could not be found.
      </p>
      <Link
        href="/"
        className="text-[var(--accent)] underline underline-offset-2 hover:no-underline"
      >
        Go home
      </Link>
    </div>
  );
}
