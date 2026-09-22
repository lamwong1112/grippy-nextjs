import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPrimaryMenu, getSiteSettings } from "@/lib/graphql";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
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
  description: "Modern D2C storefront powered by WooCommerce.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteTitle = "Grippy";
  let menuItems: Awaited<ReturnType<typeof getPrimaryMenu>> = [];

  try {
    const [settings, menu] = await Promise.all([
      getSiteSettings(),
      getPrimaryMenu(),
    ]);
    siteTitle = settings.title || "Grippy";
    menuItems = menu;
  } catch {
    // WPGraphQL may be unavailable during build; use fallbacks.
  }

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader siteTitle={siteTitle} menuItems={menuItems} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
