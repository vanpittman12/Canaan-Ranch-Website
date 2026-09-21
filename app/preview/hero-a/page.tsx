import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Hero preview A",
  robots: { index: false, follow: false },
};

export default function HeroPreviewA() {
  return <HomePage hero="a" />;
}
