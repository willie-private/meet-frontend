import Link from "next/link";
import { ThemeSwitch } from "@/components/theme";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navigation */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
            Meet
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90 dark:text-stone-900"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-28 pb-24 md:pt-36 md:pb-32">
          {/* Ambient background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
            aria-hidden
          >
            <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-teal-400/30 blur-[100px]" />
            <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-cyan-400/20 blur-[120px]" />
            <div className="absolute bottom-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
              Video meetings, reimagined
            </p>
            <h1 className="font-display mx-auto max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl lg:text-7xl">
              Meet from anywhere.
              <br />
              <span className="text-[var(--accent)]">Together.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)] sm:text-xl">
              HD video, one-click join, screen sharing, and real-time
              collaboration. No downloads, no friction — just a link. Built for
              teams that refuse to wait.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-foreground)] shadow-lg shadow-teal-500/25 transition hover:opacity-95 dark:text-stone-900 dark:shadow-teal-400/20"
              >
                Start a meeting
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border-2 border-[var(--card-border)] px-6 font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Join with code
              </Link>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-y border-[var(--card-border)] bg-[var(--card)]/50 px-6 py-20 dark:bg-stone-950/50">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to connect
            </h2>
            <p className="mx-auto max-w-2xl text-center text-[var(--muted)]">
              One platform for calls, screen share, and collaboration. Simple for
              you, powerful for your team.
            </p>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "One-click join",
                  description:
                    "Share a link. Anyone joins from the browser — no app, no install. Works on desktop and mobile.",
                  icon: "▶",
                },
                {
                  title: "HD video & audio",
                  description:
                    "Crystal-clear video and adaptive audio so everyone is seen and heard, even on slower connections.",
                  icon: "◇",
                },
                {
                  title: "Screen sharing",
                  description:
                    "Present your screen, a window, or a tab. Perfect for demos, reviews, and pair programming.",
                  icon: "▢",
                },
                {
                  title: "Real-time collaboration",
                  description:
                    "Chat, reactions, and hand raises. Stay in sync whether you’re across the room or across the globe.",
                  icon: "◆",
                },
                {
                  title: "Secure & private",
                  description:
                    "Encrypted meetings and host controls. You decide who joins and what gets shared.",
                  icon: "◈",
                },
                {
                  title: "Record & recap",
                  description:
                    "Record meetings and get a shareable link. Catch up async or keep a record for later.",
                  icon: "●",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-[var(--card-border)] bg-[var(--background)] p-6 transition hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-teal-500/5 dark:hover:shadow-teal-400/5"
                >
                  <span className="mb-3 block text-2xl text-[var(--accent)]">
                    {item.icon}
                  </span>
                  <h3 className="font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value prop / CTA strip */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built for how you work
            </h2>
            <p className="mt-4 text-lg text-[var(--muted)]">
              From daily standups to client calls to all-hands — Meet scales from
              a quick 1:1 to a room of hundreds. Same experience, everywhere.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--muted)]">
              <span>HD video</span>
              <span>•</span>
              <span>Screen share</span>
              <span>•</span>
              <span>Chat & reactions</span>
              <span>•</span>
              <span>Browser-based</span>
              <span>•</span>
              <span>No account required to join</span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-[var(--card-border)] bg-[var(--card)] px-6 py-20 dark:bg-stone-950/50">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to meet?
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Create a free account and start your first meeting in seconds.
            </p>
            <Link
              href="/auth/register"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-8 font-semibold text-[var(--accent-foreground)] transition hover:opacity-95 dark:text-stone-900"
            >
              Get started for free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-display text-sm font-semibold">Meet</span>
          <div className="flex gap-6 text-sm text-[var(--muted)]">
            <Link href="/auth/login" className="transition hover:text-[var(--foreground)]">
              Sign in
            </Link>
            <Link href="/auth/register" className="transition hover:text-[var(--foreground)]">
              Register
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-6xl text-center text-xs text-[var(--muted)]">
          Video meetings for everyone. Connect, share, and collaborate from anywhere.
        </p>
      </footer>
    </div>
  );
}
