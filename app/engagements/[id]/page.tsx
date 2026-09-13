import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContractPreview } from "@/components/contract-preview";
import { IntakeForm } from "@/components/intake-form";
import { SigningPanel } from "@/components/signing-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { UploadSigned } from "@/components/upload-signed";
import { describeDocuSignSeam } from "@/lib/docusign";
import { canCustomerEdit } from "@/lib/engagement";
import { dealEconomics, formatUsd } from "@/lib/money";
import { getEngagement } from "@/lib/store";
import { dealTitle, type Engagement } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const engagement = await getEngagement(id);
  return {
    title: engagement ? `${engagement.reference} agreement` : "Engagement",
  };
}

export default async function EngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) {
    notFound();
  }

  const seam = describeDocuSignSeam();
  const editable = canCustomerEdit(engagement.status);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
              {engagement.reference}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-forest">
              {dealTitle(engagement.intake)}
            </h1>
            <p className="mt-2 text-muted">
              {engagement.intake.buyerLegalName} · {engagement.intake.tortoiseCount} GT ·{" "}
              {formatUsd(dealEconomics(engagement.intake).total)}
            </p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>

        <StatusCopy engagement={engagement} docusignMode={seam.mode} />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <ContractPreview engagement={engagement} />
          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-white p-6">
              {editable ? (
                <SigningPanel engagement={engagement} />
              ) : (
                <SubmittedPanel engagement={engagement} />
              )}
            </div>
            {editable ? (
              <details className="rounded-2xl border border-line bg-white p-6">
                <summary className="cursor-pointer font-serif text-2xl text-forest">
                  Edit intake details
                </summary>
                <div className="mt-6">
                  <IntakeForm engagementId={engagement.id} defaults={engagement.intake} />
                </div>
              </details>
            ) : null}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function StatusCopy({
  engagement,
  docusignMode,
}: {
  engagement: Engagement;
  docusignMode: "stub" | "live_placeholder";
}) {
  if (engagement.status === "changes_requested") {
    return (
      <div className="mt-6 rounded-2xl border border-terracotta/25 bg-terracotta/8 p-5">
        <p className="font-medium text-terracotta">Canaan Preserve requested changes</p>
        <p className="mt-2 text-sm leading-6 text-ink/80">
          {engagement.changeRequestNote}
        </p>
        <p className="mt-3 text-sm text-muted">
          Update the intake if needed, then submit again for review.
        </p>
      </div>
    );
  }

  if (engagement.status === "pending_review") {
    return (
      <div className="mt-6 rounded-2xl border border-brass/30 bg-wheat/60 p-5">
        <p className="font-medium text-forest">Submitted for review</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          The team has your {engagement.signingMethod === "docusign" ? "DocuSign" : "manual"}{" "}
          preference
          {engagement.signedArtifact ? " and a signed copy is already on file" : ""}. The
          engagement will not close until Canaan Preserve accepts.
        </p>
      </div>
    );
  }

  if (engagement.status === "declined") {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <p className="font-medium text-ink">This engagement was declined</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {engagement.reviews.at(-1)?.note ||
            "Canaan Preserve is not moving forward with this engagement."}
        </p>
      </div>
    );
  }

  if (engagement.status === "accepted") {
    return (
      <div className="mt-6 rounded-2xl border border-sage/40 bg-sage/10 p-5">
        <p className="font-medium text-forest">Accepted — awaiting signed artifact</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {engagement.signingMethod === "docusign"
            ? `DocuSign is in ${docusignMode} mode. Envelope ${engagement.docusign.envelopeId ?? "is pending"}. ${engagement.docusign.lastMessage ?? ""}`
            : "Upload the signed PDF to complete execution. Accept has been recorded; the agreement is not executed until the file is on file."}
        </p>
      </div>
    );
  }

  if (engagement.status === "executed") {
    return (
      <div className="mt-6 rounded-2xl border border-forest/20 bg-forest text-cream p-5">
        <p className="font-medium">Agreement executed</p>
        <p className="mt-2 text-sm leading-6 text-cream/80">
          Canaan Preserve accepted this engagement and a signed artifact is on file
          {engagement.signedArtifact
            ? ` (${engagement.signedArtifact.filename}).`
            : "."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-5">
      <p className="font-medium text-forest">Agreement preview</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Review the populated contract, choose a signing path, and submit when you are ready.
      </p>
    </div>
  );
}

function SubmittedPanel({ engagement }: { engagement: Engagement }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-forest">Next steps</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Signing method:{" "}
          {engagement.signingMethod === "docusign"
            ? "DocuSign after accept"
            : engagement.signingMethod === "manual"
              ? "Manual PDF"
              : "Not selected"}
          .
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a className="btn-secondary" href={`/api/engagements/${engagement.id}/contract`}>
          Download agreement PDF
        </a>
        {engagement.signedArtifact ? (
          <a className="btn-secondary" href={`/api/engagements/${engagement.id}/signed`}>
            Download signed copy
          </a>
        ) : null}
      </div>
      {engagement.status === "accepted" && engagement.signingMethod === "manual" ? (
        <UploadSigned engagement={engagement} />
      ) : null}
      {engagement.status === "pending_review" && engagement.signingMethod === "manual" ? (
        <UploadSigned engagement={engagement} compact />
      ) : null}
      <p className="text-sm text-muted">
        Questions? Write {engagement.intake.buyerEmail} into your own records, or contact
        Canaan Preserve from the footer. Team members review the queue at{" "}
        <Link className="underline" href="/admin">
          /admin
        </Link>
        .
      </p>
    </div>
  );
}
