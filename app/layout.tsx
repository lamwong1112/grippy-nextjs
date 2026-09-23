import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/graphql";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Grippy",
    template: "%s · Grippy",
  },
  description:
    "Sustainable climbing chalk from seawater — built for Hong Kong humidity. Zero mining, cleaner grip, direct to climbers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteTitle = "Grippy";

  try {
    const settings = await getSiteSettings();
    siteTitle = settings.title || "Grippy";
  } catch {
    // WPGraphQL may be unavailable during build; use fallbacks.
  }

  return (
    <html
      lang="en"
      className={`${figtree.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader siteTitle={siteTitle} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
