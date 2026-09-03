import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Canonical public origin — set NEXT_PUBLIC_SITE_URL in production deploys. */
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://wonderweave.app"
).replace(/\/$/, "");

const titleDefault = "Wonderweave — Cozy Offline Match-3 Puzzle Adventure";
const titleShort = "Wonderweave Match-3 Puzzle";
const description =
  "Play Wonderweave free in your browser: a cozy offline match-3 puzzle game. Swap charms, chain combos, unlock floating isles, and seal the Folio with Pip the lantern bunny — no download required on web, no always-online grind.";

const keywords = [
  "Wonderweave",
  "match 3",
  "match-3",
  "match 3 puzzle",
  "match 3 game",
  "offline match 3",
  "cozy match 3",
  "cozy puzzle game",
  "casual puzzle game",
  "free match 3 game",
  "puzzle adventure",
  "tile matching game",
  "combo puzzle",
  "floating isles",
  "Pip the bunny",
    "browser puzzle game",
    "PWA puzzle game",
    "relaxing puzzle game",
];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#101d13" },
    { media: "(prefers-color-scheme: dark)", color: "#101d13" },
  ],
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titleDefault,
    template: "%s · Wonderweave",
  },
  description,
  applicationName: "Wonderweave",
  keywords,
  authors: [{ name: "Wonderweave" }],
  creator: "Wonderweave",
  publisher: "Wonderweave",
  category: "games",
  classification: "Puzzle / Match-3 / Casual",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/favicon-32.png",
    other: [{ rel: "mask-icon", url: "/icons/icon-maskable-512.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Wonderweave",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Wonderweave",
    title: titleDefault,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wonderweave — cozy match-3 puzzle with Pip the lantern bunny on the floating isles",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titleShort,
    description:
      "Cozy offline match-3 puzzle adventure. Swap charms, chain combos, explore floating isles with Pip.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "game:tag": "match-3,puzzle,casual,cozy,offline",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Wonderweave",
      description,
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#org`,
      name: "Wonderweave",
      url: siteUrl,
      logo: `${siteUrl}/icons/icon-512.png`,
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "Wonderweave",
      url: siteUrl,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. HTML5.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description,
      image: `${siteUrl}/og-image.png`,
      isAccessibleForFree: true,
    },
    {
      "@type": "VideoGame",
      "@id": `${siteUrl}/#game`,
      name: "Wonderweave",
      alternateName: [
        "Wonderweave Match-3",
        "Wonderweave: Threads of a Forgotten World",
      ],
      description,
      url: siteUrl,
      image: `${siteUrl}/og-image.png`,
      genre: ["Match-3", "Puzzle", "Casual", "Adventure"],
      gamePlatform: ["Web Browser", "Android"],
      playMode: "SinglePlayer",
      applicationCategory: "Game",
      operatingSystem: "Android, Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      author: { "@id": `${siteUrl}/#org` },
      publisher: { "@id": `${siteUrl}/#org` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
