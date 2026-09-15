import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { brand } from "@/lib/brand";
import { canonicalPath } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Use of the Canaan Preserve site and relocation agreement is subject to the agreement you download.",
  alternates: { canonical: canonicalPath("/terms") },
  openGraph: { url: canonicalPath("/terms") },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <p>
        Use of this site and any relocation agreement is subject to the terms of the
        agreement you download. The contracting entity is {brand.legalName}.
      </p>
      <p>
        Review the{" "}
        <a
          className="text-forest underline underline-offset-2"
          href="/api/agreement-template"
        >
          blank agreement
        </a>{" "}
        before intake, or{" "}
        <Link href="/intake" prefetch={false} className="text-forest underline underline-offset-2">
          start intake
        </Link>{" "}
        to generate a populated copy.
      </p>
      <p>This page is a short summary, not a complete terms of use.</p>
    </LegalPage>
  );
}
