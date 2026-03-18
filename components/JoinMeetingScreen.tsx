"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/lib/authFetch";
import {
  mapActiveParticipantsToMeeting,
  useMeetingSocket,
  type ActiveParticipantFromJoin,
  type MeetingParticipant,
  type ParticipantJoinedPayload,
} from "@/lib/meetingSocket";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const JOINING_DURATION_MS = 1800;
const LOADING_DURATION_MS = 1500;

function getInitials(name: string): string {
  const s = String(name ?? "").trim();
  if (!s) return "?";
  return s
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Display name for a participant: always username/name/email, never ID */
function getParticipantDisplayName(p: MeetingParticipant): string {
  return (
    p.username ??
    p.name ??
    (p as { email?: string }).email ??
    "Guest"
  );
}

/** Single participant tile – fills grid cell, Zoom-style */
function ParticipantTile({
  participant,
  isYou,
}: {
  participant: MeetingParticipant;
  isYou?: boolean;
}) {
  const name = getParticipantDisplayName(participant);
  const initials = getInitials(name);
  return (
    <div
      className="group relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-gradient-to-b from-zinc-800/95 to-zinc-900/95 p-2 shadow-inner ring-1 ring-white/5 transition-all duration-200 hover:border-teal-400/30 hover:ring-teal-400/20 min-h-0 min-w-0 sm:gap-1.5 sm:p-2.5"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex shrink-0 items-center justify-center">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 sm:text-base md:h-11 md:w-11 md:text-lg"
          style={{
            background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)",
            color: "#fff",
            boxShadow:
              "0 4px 16px -2px rgba(13, 148, 136, 0.35), 0 0 0 2px rgba(45, 212, 191, 0.15), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          {initials}
        </div>
        {isYou && (
          <span
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white sm:text-[10px]"
            style={{
              background: "linear-gradient(135deg, #0d9488, #2dd4bf)",
              boxShadow: "0 1px 4px rgba(13, 148, 136, 0.4)",
            }}
          >
            You
          </span>
        )}
      </div>

      <span className="max-w-full truncate text-center text-[10px] font-semibold tracking-tight text-white drop-shadow-sm sm:text-xs md:text-sm">
        {name}
      </span>
    </div>
  );
}

/** No-permission badge (yellow circle with !) for mic/video */
function NoPermissionBadge() {
  return (
    <span
      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black"
      aria-label="No permission"
    >
      !
    </span>
  );
}

/** Non-clickable bottom bar icon (Google Meet style). Use showWarning for mic/video not working. */
function BarIcon({
  children,
  "aria-label": ariaLabel,
  size = "md",
  showWarning = false,
}: {
  children: React.ReactNode;
  "aria-label": string;
  size?: "md" | "sm";
  showWarning?: boolean;
}) {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10 sm:h-12 sm:w-12";
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5 sm:h-6 sm:w-6";
  return (
    <div
      className={`relative flex ${sizeClass} cursor-default items-center justify-center rounded-full bg-zinc-700/80 text-white focus:outline-none`}
      role="img"
      aria-label={ariaLabel}
    >
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {showWarning && <NoPermissionBadge />}
    </div>
  );
}

/** Live system time for bottom bar – updates every second */
function MeetingTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const format = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    format();
    const id = setInterval(format, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

type GuidelineBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

const GUIDELINE_SECTIONS: { title: string; blocks: GuidelineBlock[] }[] = [
  {
    title: "1. Purpose",
    blocks: [
      { type: "p", text: "To protect employees and the company from AI-based impersonation, deepfake, and real-time face/voice manipulation risks, we are implementing a Secure Meeting Protection Plugin within our internal meeting platform." },
      { type: "p", text: "This plugin:" },
      { type: "ul", items: ["Verifies camera feed integrity", "Monitors for real-time video manipulation patterns", "Confirms device-level authenticity signals", "Prevents unauthorized virtual camera overlays", "Adds an additional security layer before microphone and camera activation"] },
      { type: "p", text: "The plugin is mandatory for all internal video meetings." },
    ],
  },
  {
    title: "2. Why Installation Is Required",
    blocks: [
      { type: "p", text: "Modern impersonation attacks can use:" },
      { type: "ul", items: ["Real-time AI face swap overlays", "Synthetic voice injection", "Virtual camera streaming tools", "Deepfake rendering software"] },
      { type: "p", text: "Standard browser permissions (camera/mic access) do not detect these risks." },
      { type: "p", text: "The Secure Meeting Plugin adds:" },
      { type: "ul", items: ["Device-level validation checks", "Camera source verification", "Virtual device detection", "Session integrity validation before enabling video/audio"] },
      { type: "p", text: "Without this plugin installed, users will not be able to activate camera or microphone in the meeting system." },
    ],
  },
  {
    title: "3. Technical Overview (High-Level)",
    blocks: [
      { type: "p", text: "The plugin:" },
      { type: "ul", items: ["Integrates with the browser via extension or desktop component", "Interfaces with the operating system's media device layer", "Validates hardware-backed camera sources", "Detects non-standard video injection tools", "Performs real-time signal integrity checks"] },
      { type: "p", text: "All processing is limited to security validation within meeting sessions." },
    ],
  },
  {
    title: "4. Installation Steps",
    blocks: [
      { type: "p", text: "1. Open the link below." },
      { type: "p", text: "2. Download and install as instructed." },
    ],
  },
  {
    title: "5. Compatibility Requirements",
    blocks: [
      { type: "p", text: "Minimum requirements:" },
      { type: "ul", items: ["Windows 10 or later / macOS 12 or later", "Latest version of Chrome, Edge, or approved browser", "Company-managed device (recommended)"] },
      { type: "p", text: "Virtual machines and remote desktop environments may not be supported." },
    ],
  },
  {
    title: "6. After Installation",
    blocks: [
      { type: "p", text: "When joining a meeting:" },
      { type: "p", text: "The system will automatically verify:" },
      { type: "ul", items: ["Plugin presence", "Plugin version", "Device authenticity status"] },
      { type: "p", text: "If verification passes: Camera and microphone activation will be enabled." },
      { type: "p", text: "If verification fails: You will see a security validation error; follow on-screen troubleshooting steps." },
    ],
  },
  {
    title: "7. Troubleshooting",
    blocks: [
      { type: "p", text: "Camera not detected:" },
      { type: "ul", items: ["Ensure no other application is using the camera", "Disable third-party virtual camera software"] },
      { type: "p", text: "Plugin not recognized:" },
      { type: "ul", items: ["Restart browser", "Restart device", "Reinstall plugin"] },
      { type: "p", text: "If issues persist, contact IT Support with:" },
      { type: "ul", items: ["Operating system version", "Browser version", "Screenshot of error message"] },
    ],
  },
  {
    title: "8. Security & Privacy Assurance",
    blocks: [
      { type: "p", text: "This implementation is designed to:" },
      { type: "ul", items: ["Protect employees from impersonation", "Protect the company from financial fraud and identity attacks", "Ensure meeting authenticity"] },
      { type: "p", text: "The plugin operates strictly within company security policy and applicable data protection regulations." },
      { type: "p", text: "It does not perform employee surveillance." },
    ],
  },
  {
    title: "9. Compliance",
    blocks: [
      { type: "p", text: "Installation and usage of the Secure Meeting Protection Plugin is mandatory for:" },
      { type: "ul", items: ["Internal video meetings", "Executive calls", "HR discussions", "Financial or approval-based sessions"] },
      { type: "p", text: "Failure to install will result in restricted meeting access." },
    ],
  },
];

function GuidelineCards() {
  return (
    <div className="space-y-6 pb-4">
      {GUIDELINE_SECTIONS.map((section, index) => (
        <section key={section.title}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {section.title}
          </h3>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {section.blocks.map((block, i) =>
              block.type === "p" ? (
                <p key={i}>{block.text}</p>
              ) : (
                <ul key={i} className="list-disc space-y-0.5 pl-5">
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Media permission modal – two tabs: Quick installation + Guidelines accordion */
function MediaPermissionModal({ onLeave }: { onLeave: () => void }) {
  const [activeTab, setActiveTab] = useState<"quick" | "guidelines">("quick");

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secure-meeting-plugin-title"
    >
      <div
        className="pointer-events-auto flex max-h-[80vh] w-full max-w-[550px] flex-col overflow-hidden rounded-2xl bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl dark:bg-zinc-950/95"
        style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.32)" }}
      >
        {/* Glowing header band – uses product accent color */}
        <div className="relative flex items-center justify-between gap-3 border-b border-zinc-200/70 bg-[var(--accent)] px-5 py-3.5 dark:border-zinc-800">
          <div className="absolute inset-0 opacity-20 mix-blend-screen blur-2xl" aria-hidden />
          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm ring-1 ring-white/40">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="4" y="3" width="10" height="14" rx="2" />
                <path d="M18 8l3-2v8l-3-2z" />
                <path d="M8 21h6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal-50/90">
                Meeting security
              </p>
              <h2
                id="secure-meeting-plugin-title"
                className="text-base font-semibold text-[var(--accent-foreground)]"
              >
                Secure Meeting Protection Plugin
              </h2>
            </div>
          </div>
          <span className="relative hidden rounded-full bg-black/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-foreground)] ring-1 ring-white/25 sm:inline-flex">
            For internal video calls
          </span>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden px-4 pt-3.5 pb-3">
          {/* Tabs */}
          <div className="mx-auto mt-1 flex w-full max-w-xs items-center justify-center gap-1.5 rounded-full bg-zinc-100/90 p-1 text-xs font-medium text-zinc-600 shadow-inner dark:bg-zinc-900/80 dark:text-zinc-300">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
                activeTab === "quick"
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700"
                  : "hover:text-zinc-900/90 dark:hover:text-zinc-50"
              }`}
              aria-selected={activeTab === "quick"}
              role="tab"
            >
              Quick installation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("guidelines")}
              className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
                activeTab === "guidelines"
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700"
                  : "hover:text-zinc-900/90 dark:hover:text-zinc-50"
              }`}
              aria-selected={activeTab === "guidelines"}
              role="tab"
            >
              Full guidelines
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "quick" && (
            <div className="mt-4 flex flex-1 flex-col text-sm leading-snug text-zinc-700 dark:text-zinc-200">
              <h3 className="text-center text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Secure Meeting Protection Plugin Required❔
              </h3>
              <p className="mt-1.5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Set up the plugin once on this device to safely turn on your microphone and camera for internal meetings.
              </p>

              <div className="mt-4 flex flex-col gap-2.5 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-foreground)] shadow">
                    1
                  </div>
                  <p>
                    Open your system{" "}
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                      Terminal
                    </span>
                    .
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-foreground)] shadow">
                    2
                  </div>
                  <p>
                    Copy the command below, paste it into the terminal, and press{" "}
                    <span className="font-medium">Enter</span>.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-900 px-3 py-2.5 text-sm font-mono text-zinc-100 shadow-inner dark:border-zinc-700 dark:bg-black/80">
                <div className="flex-1 truncate">
                  <span className="text-zinc-400">Command:</span>
                  <span className="ml-1 text-zinc-100">...</span>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-100 hover:bg-zinc-700"
                >
                  Copy
                </button>
              </div>

              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Once installation is complete, come back to this tab and continue. If anything fails, switch to{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-200">Full guidelines</span> for detailed troubleshooting.
              </p>

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={onLeave}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-500 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                    />
                  </svg>
                  Leave room
                </button>
              </div>
            </div>
          )}

          {activeTab === "guidelines" && (
            <div className="mt-3 flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <GuidelineCards />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Bottom-right popup: "Your meeting's ready" with copyable meeting link (shown alongside media modal) */
function MeetingReadyPopup({
  identifier,
  userEmail,
  onClose,
}: {
  identifier: string;
  userEmail: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const meetingLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/${identifier}`
      : "";

  async function handleCopy() {
    if (!meetingLink) return;
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed bottom-20 left-4 z-[105] w-full max-w-[280px] rounded-xl border border-[var(--card-border)] bg-white shadow-xl dark:bg-zinc-900 dark:border-zinc-700"
      role="dialog"
      aria-labelledby="meeting-ready-title"
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-1.5">
          <h2
            id="meeting-ready-title"
            className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
          >
            Your meeting&apos;s ready
          </h2>
          {/* <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button> */}
        </div>

        {/* <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add others
        </button> */}

        {/* <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Or share this meeting link with others you want in the meeting
        </p> */}

        <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-800">
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
            {meetingLink || `${identifier} (loading…)`}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            aria-label={copied ? "Copied" : "Copy link"}
            title={copied ? "Copied!" : "Copy link"}
          >
            {copied ? (
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          People who use this meeting link must get your permission before they can join.
        </p>

        <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
          Joined as {userEmail}
        </p>
      </div>
    </div>
  );
}

type Phase = "joining" | "loading" | "ready";

interface JoinMeetingScreenProps {
  identifier: string;
}

export function JoinMeetingScreen({ identifier }: JoinMeetingScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const joinCalled = useRef(false);
  const [phase, setPhase] = useState<Phase>("joining");
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showMeetingLinkPopup, setShowMeetingLinkPopup] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [initialParticipantsFromJoin, setInitialParticipantsFromJoin] = useState<
    MeetingParticipant[] | null
  >(null);

  const { participants, onParticipantJoined, onEndCall } = useMeetingSocket(
    phase === "ready" ? identifier : null,
    initialParticipantsFromJoin
  );

  async function handleLeaveRoom() {
    try {
      const leaveUrl = `${API_BASE_URL}/api/v1/meetings/${identifier}/leave`;
      await authFetch(leaveUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      }).catch(() => {
        // ignore network/API errors on leave; still navigate user away
      });
    } finally {
      router.replace("/dashboard?call_ended=1");
    }
  }

  useEffect(() => {
    onEndCall(() => {
      router.replace("/dashboard?call_ended=1");
    });
  }, [onEndCall, router]);

  useEffect(() => {
    onParticipantJoined(({ participant, userId }: ParticipantJoinedPayload) => {
      const name =
        (participant as { name?: string }).name ??
        (participant as { username?: string }).username ??
        (participant as { email?: string }).email ??
        userId;
      setToastMessage(`${name} joined the meeting`);
    });
  }, [onParticipantJoined]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Call join meeting API once when in joining phase
  useEffect(() => {
    if (phase !== "joining" || joinCalled.current) return;
    joinCalled.current = true;
    setJoinError(null);

    const joinUrl = `${API_BASE_URL}/api/v1/meetings/${identifier}/join`;
    authFetch(joinUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setJoinError(data?.message ?? data?.error ?? `Failed to join meeting (${res.status})`);
          return;
        }
        const activeParticipants = (data as { activeParticipants?: ActiveParticipantFromJoin[] })
          ?.activeParticipants;
        if (Array.isArray(activeParticipants)) {
          setInitialParticipantsFromJoin(mapActiveParticipantsToMeeting(activeParticipants));
        }
        setJoinSuccess(true);
      })
      .catch((err) => {
        setJoinError(err instanceof Error ? err.message : "Failed to join meeting");
      });
  }, [phase, identifier, authFetch]);

  // After join API success, run loading → ready timers
  useEffect(() => {
    if (!joinSuccess) return;
    const t1 = setTimeout(() => setPhase("loading"), JOINING_DURATION_MS);
    const t2 = setTimeout(
      () => setPhase("ready"),
      JOINING_DURATION_MS + LOADING_DURATION_MS
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [joinSuccess]);

  useEffect(() => {
    if (phase === "ready") setShowMediaModal(true);
  }, [phase]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Blurred background: dark gradient matching participant tiles (zinc-800/900) */}
      <div
        className="absolute inset-0 z-0 scale-110"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, #3f3f46 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 80% 60%, #27272a 0%, transparent 45%),
            radial-gradient(ellipse 100% 100% at 50% 50%, #27272a 0%, #18181b 100%)
          `,
          filter: "blur(48px)",
        }}
      />
      <div className="absolute inset-0 z-0 bg-zinc-900/90" aria-hidden />

      {/* Joining: loader or error */}
      {phase === "joining" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-opacity"
          aria-live="polite"
          aria-label={joinError ? "Join failed" : "Joining meeting"}
        >
          {joinError ? (
            <div className="mx-4 flex max-w-md flex-col items-center gap-4 rounded-2xl bg-white p-6 dark:bg-zinc-900">
              <p className="text-center text-zinc-800 dark:text-zinc-100">
                {joinError}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    joinCalled.current = false;
                    setJoinError(null);
                  }}
                  className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-lg font-medium text-white">Joining...</p>
            </div>
          )}
        </div>
      )}

      {/* Full screen loader: Loading... (full dark) */}
      {phase === "loading" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0a09] transition-opacity dark:bg-[#0c0a09]"
          aria-live="polite"
          aria-label="Loading meeting"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-lg font-medium text-white">Loading...</p>
          </div>
        </div>
      )}

      {/* Toast: participant joined */}
      {toastMessage && (
        <div
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-zinc-700"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      {/* Media permission modal - fixed, cannot be closed; shown when meeting is ready */}
      {phase === "ready" && showMediaModal && <MediaPermissionModal onLeave={handleLeaveRoom} />}

      {/* Meeting link popup - bottom left, shown alongside media modal */}
      {phase === "ready" && showMeetingLinkPopup && (
        <MeetingReadyPopup
          identifier={identifier}
          userEmail={user?.email ?? "Guest"}
          onClose={() => setShowMeetingLinkPopup(false)}
        />
      )}

      {/* Ready: Zoom-style full-screen grid of participant tiles */}
      {phase === "ready" && (() => {
        const others = participants.filter((p) => (p.user_id ?? p.userId) !== user?.id);
        const tileCount = 1 + others.length;
        const cols = Math.max(1, Math.ceil(Math.sqrt(tileCount)));
        const rows = Math.max(1, Math.ceil(tileCount / cols));
        return (
          <>
            {/* Frosted overlay – dark, same as participant tile feel */}
            <div className="fixed inset-0 z-10 bg-zinc-800/40 backdrop-blur-2xl" aria-hidden />

            {/* Meeting id overlay – dark frosted */}
            <div className="fixed left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-zinc-800/80 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-2xl">
              Meeting: {identifier}
            </div>

            {/* Participant grid – dark frosted background */}
            <div
              className="fixed inset-0 top-0 z-20 flex items-center justify-center bg-zinc-800/30 backdrop-blur-2xl pb-20 pt-14"
            >
              <div
                className="grid h-[65vh] max-h-[480px] w-full max-w-3xl gap-1.5 sm:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
              >
              <ParticipantTile
                participant={{
                  userId: user?.id,
                  user_id: user?.id,
                  username: user?.username,
                }}
                isYou
              />
              {others.map((p) => (
                <ParticipantTile
                  key={p.id ?? p.user_id ?? p.userId ?? String(Math.random())}
                  participant={p}
                  isYou={false}
                />
              ))}
              </div>
            </div>

            {/* Bottom control bar – blurred like rest of screen */}
            <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-white/10 bg-zinc-800/60 px-4 py-3 backdrop-blur-3xl">
              {/* Left: time and meeting ID */}
              <div className="flex shrink-0 items-center gap-1 text-xs text-white/80">
                <MeetingTime />
                <span className="opacity-60">|</span>
                <span>{identifier}</span>
              </div>

              {/* Center: Google Meet–style icons (all non-clickable) */}
              <div className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
                <BarIcon aria-label="Microphone (no permission)" showWarning>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </BarIcon>
                <BarIcon aria-label="Camera (no permission)" showWarning>
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </BarIcon>
                <BarIcon aria-label="Present">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </BarIcon>
                <BarIcon aria-label="Reactions">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </BarIcon>
                <BarIcon aria-label="Participants">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </BarIcon>
                <BarIcon aria-label="Chat">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </BarIcon>
                <BarIcon aria-label="Hand raise">
                  <path d="M12 2v8m0 0l3-3m-3 3L9 7" />
                  <path d="M7 22v-4a2 2 0 012-2h6a2 2 0 012 2v4" />
                </BarIcon>
                <BarIcon aria-label="More options">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </BarIcon>
                <div
                  className="flex h-10 w-10 cursor-default items-center justify-center rounded-full bg-red-600/70 text-white focus:outline-none sm:h-12 sm:w-12"
                  aria-label="Leave call (disabled)"
                >
                  <svg className="h-5 w-5 rotate-[135deg] sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
              </div>

              {/* Right: info, chat, layout */}
              <div className="flex shrink-0 items-center gap-1.5 text-white/80">
                <BarIcon aria-label="Info" size="sm">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </BarIcon>
                <BarIcon aria-label="Chat" size="sm">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </BarIcon>
                <BarIcon aria-label="Layout" size="sm">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </BarIcon>
              </div>
            </div>

            {/* Blur effect popup – on top of everything, no text or content */}
            <div
              id="blur-effect-popup"
              className="blur-effect-popup pointer-events-none fixed inset-0 z-[100] backdrop-blur-xs"
              aria-hidden
            />
          </>
        );
      })()}
    </div>
  );
}
