import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentDesk } from "@/components/document-desk";
import { EngagementTimeline } from "@/components/engagement-timeline";
import { IntakeForm } from "@/components/intake-form";
import { SigningPanel } from "@/components/signing-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { UploadSigned } from "@/components/upload-signed";
import { describeDocuSignSeam } from "@/lib/docusign";
import { canCustomerEdit } from "@/lib/engagement";
import { dealEconomics, formatUsd } from "@/lib/money";
import { documentDownloadPath } from "@/lib/auth";
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
  const contractUrl = await documentDownloadPath(engagement.id, "contract");
  const signedUrl = engagement.signedArtifact
    ? await documentDownloadPath(engagement.id, "signed")
    : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
              {engagement.reference}
            </p>
            <h1 className="type-h1 mt-2 text-forest">{dealTitle(engagement.intake)}</h1>
            <p className="mt-2 text-muted">
              {engagement.intake.buyerLegalName} · {engagement.intake.tortoiseCount} GT ·{" "}
              {formatUsd(dealEconomics(engagement.intake).total)} adult-rate total
            </p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>

        <ConfirmationCard engagement={engagement} />
        <StatusCopy engagement={engagement} docusignMode={seam.mode} />

        <div className="mt-8 space-y-6">
          <DocumentDesk
            reference={engagement.reference}
            contractUrl={contractUrl}
            signedUrl={signedUrl}
          />
          <EngagementTimeline engagement={engagement} />

          <div className="surface-card">
            {editable ? (
              <SigningPanel engagement={engagement} contractUrl={contractUrl} />
            ) : (
              <SubmittedPanel
                engagement={engagement}
                contractUrl={contractUrl}
                signedUrl={signedUrl}
              />
            )}
          </div>

          {editable ? (
            <details className="surface-card">
              <summary className="cursor-pointer font-serif text-2xl font-medium text-forest">
                Edit intake details
              </summary>
              <div className="mt-6">
                <IntakeForm engagementId={engagement.id} defaults={engagement.intake} />
              </div>
            </details>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ConfirmationCard({ engagement }: { engagement: Engagement }) {
  if (engagement.status !== "draft" && engagement.status !== "pending_review") {
    return null;
  }

  return (
    <section className="mt-6 rounded-[16px] border border-line bg-cream p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
        Confirmation
      </p>
      <h2 className="type-h2 mt-2 text-forest">{engagement.reference}</h2>
      <p className="mt-2 text-[17px] leading-[27px] text-ink">
        {engagement.status === "draft"
          ? "Intake is saved. Download the populated Word agreement first, then choose a signing path."
          : "This engagement is in the Canaan Preserve review queue."}
      </p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted">
        <li>Download the populated Word agreement.</li>
        <li>Choose DocuSign after Accept, or a manual signed PDF.</li>
        <li>Canaan Preserve reviews. Nothing is executed until Accept and a signed copy are on file.</li>
      </ol>
    </section>
  );
}

function StatusCopy({
  engagement,
  docusignMode,
}: {
  engagement: Engagement;
  docusignMode: "stub" | "live";
}) {
  if (engagement.status === "changes_requested") {
    return (
      <div className="mt-6 rounded-[16px] border border-terracotta/25 bg-white p-5">
        <p className="font-medium text-terracotta">Canaan Preserve requested changes</p>
        <p className="mt-2 text-sm leading-6 text-ink/80">{engagement.changeRequestNote}</p>
        <p className="mt-3 text-sm text-muted">
          Update the intake if needed, then submit again for review.
        </p>
      </div>
    );
  }

  if (engagement.status === "pending_review") {
    return (
      <div className="mt-6 rounded-[16px] border border-line bg-white p-5">
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
      <div className="mt-6 rounded-[16px] border border-line bg-white p-5">
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
      <div className="mt-6 rounded-[16px] border border-sage bg-cream p-5">
        <p className="font-medium text-forest">Awaiting seller signature</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {engagement.signingMethod === "docusign"
            ? `Accept is recorded. The engagement stays pending until Van/seller signs on DocuSign. Envelope ${engagement.docusign.envelopeId ?? "is pending"} (${docusignMode}). ${engagement.docusign.lastMessage ?? ""}`
            : "Accept is recorded. Upload the signed PDF to complete execution. The agreement is not done until the seller-signed file is on file."}
        </p>
      </div>
    );
  }

  if (engagement.status === "executed") {
    return (
      <div className="mt-6 rounded-[16px] border border-forest bg-forest p-5 text-cream">
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

  return null;
}

function SubmittedPanel({
  engagement,
  contractUrl,
  signedUrl,
}: {
  engagement: Engagement;
  contractUrl: string;
  signedUrl: string | null;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="type-h2 text-forest">Signing status</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Signing method:{" "}
          {engagement.signingMethod === "docusign"
            ? "DocuSign after accept"
            : engagement.signingMethod === "manual"
              ? "Download and upload a signed copy"
              : "Not selected"}
          .
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a className="btn-secondary" href={contractUrl}>
          Download agreement
        </a>
        {signedUrl ? (
          <a className="btn-secondary" href={signedUrl}>
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
