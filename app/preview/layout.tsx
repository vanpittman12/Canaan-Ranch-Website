import type { ReactNode } from "react";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
