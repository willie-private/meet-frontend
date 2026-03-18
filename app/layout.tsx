import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SessionExpiredOverlay } from "@/components/SessionExpiredOverlay";
import { ThemeProvider } from "@/components/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const themeScript = `
(function() {
  const stored = localStorage.getItem('meet-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = stored === 'dark' || (!stored && prefersDark);
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();
`;

export const metadata: Metadata = {
  title: "Meet — Video meetings for everyone",
  description:
    "HD video meetings, one-click join, screen share, and real-time collaboration. Meet from anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased font-sans`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <AuthProvider>
            {children}
            <SessionExpiredOverlay />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
