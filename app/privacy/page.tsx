import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { brand } from "@/lib/brand";
import { canonicalPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Canaan Preserve uses intake details to prepare a relocation agreement and contact you about that reservation.",
  alternates: { canonical: canonicalPath("/privacy") },
  openGraph: { url: canonicalPath("/privacy") },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        Canaan Preserve uses the details you submit on{" "}
        <Link href="/intake" className="text-forest underline underline-offset-2">
          intake
        </Link>{" "}
        to populate your relocation agreement and to contact you about that reservation.
        We do not sell this information.
      </p>
      <p>
        Questions:{" "}
        <a className="text-forest underline underline-offset-2" href={`mailto:${brand.email}`}>
          {brand.email}
        </a>
        .
      </p>
      <p>This page is a short summary, not a complete privacy policy.</p>
    </LegalPage>
  );
}
