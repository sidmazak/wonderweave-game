import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#101d13",
};

export const metadata: Metadata = {
  title: "Wonderweave — Threads of a Forgotten World",
  description: "A cozy match-3 adventure across the floating isles. Weave charms, chain combos, and seal the Folio across 12 handcrafted chapters.",
  keywords: ["Wonderweave", "match 3", "puzzle game", "casual game"],
  authors: [{ name: "Wonderweave" }],
  icons: {
    icon: "/game/assets/tile-star.png",
  },
  openGraph: {
    title: "Wonderweave — Threads of a Forgotten World",
    description: "A cozy match-3 adventure across the floating isles.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
