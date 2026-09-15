import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { brand } from "@/lib/brand";
import { BRAND_MARK_SRC } from "@/lib/brand-mark-asset";
import { SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
});

const description =
  "Canaan Preserve is an FWC Approved Tier 1 Long-Term Recipient Site. Gopher tortoise intake, downloadable relocation agreement, signature, and internal review.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: brand.name,
    title: brand.name,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description,
  },
  icons: {
    icon: [{ url: BRAND_MARK_SRC, type: "image/svg+xml" }],
    apple: BRAND_MARK_SRC,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
