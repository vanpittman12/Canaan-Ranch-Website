import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { canonicalPath, OG_IMAGE } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: canonicalPath("/") },
  openGraph: { url: canonicalPath("/"), images: [OG_IMAGE] },
};

export default function Home() {
  return <HomePage />;
}
