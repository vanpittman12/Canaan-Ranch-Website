import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { canonicalPath } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: canonicalPath("/") },
  openGraph: { url: canonicalPath("/") },
};

export default function Home() {
  return <HomePage />;
}
