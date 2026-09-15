import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { brand } from "@/lib/brand";
import { PRIVACY_DESCRIPTION, pageShareMetadata } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy",
  ...pageShareMetadata("/privacy", "Privacy", PRIVACY_DESCRIPTION),
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        Canaan Preserve uses the details you submit on{" "}
        <Link href="/intake" prefetch={false} className="text-forest underline underline-offset-2">
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
