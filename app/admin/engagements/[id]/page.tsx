import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/actions/admin";
import { ContractPreview } from "@/components/contract-preview";
import { RateOverrideForm } from "@/components/rate-override-form";
import { ReviewForm } from "@/components/review-form";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { brand } from "@/lib/brand";
import { describeDocuSignSeam } from "@/lib/docusign";
import { addOneYear, dealEconomics, formatLongDate, formatUsd } from "@/lib/money";
import { getEngagement } from "@/lib/store";
import { buyerNoticeAddress, dealTitle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) {
    notFound();
  }
  const seam = describeDocuSignSeam();
  const economics = dealEconomics(engagement.intake);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader variant="admin" />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <Link href="/admin" className="text-sm text-muted hover:text-forest">
          ← Back to queue
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
              {engagement.reference}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-forest">
              {dealTitle(engagement.intake)}
            </h1>
            <p className="mt-2 text-muted">
              {engagement.intake.buyerLegalName} · {engagement.intake.buyerAttention}
            </p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-line bg-white p-6">
              <h2 className="font-serif text-2xl text-forest">Intake</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <Row
                  label="Effective"
                  value={
                    engagement.effectiveDate
                      ? formatLongDate(engagement.effectiveDate)
                      : "Set when the Buyer signs"
                  }
                />
                <Row
                  label="Expiration"
                  value={
                    engagement.effectiveDate
                      ? formatLongDate(addOneYear(engagement.effectiveDate))
                      : "Effective Date + 1 year"
                  }
                />
                <Row label="Buyer" value={engagement.intake.buyerLegalName} />
                <Row label="Attention" value={engagement.intake.buyerAttention} />
                <Row label="Email" value={engagement.intake.buyerEmail} />
                <Row label="Phone" value={engagement.intake.buyerPhone} />
                <Row label="Notice" value={buyerNoticeAddress(engagement.intake)} />
                <Row
                  label="Reserved capacity"
                  value={`${engagement.intake.tortoiseCount} gopher tortoises`}
                />
                <Row label="Adult rate" value={`${economics.rateFormatted} per adult`} />
                <Row label="Est. adult total" value={economics.totalFormatted} />
                <Row label="County of relocation" value={engagement.intake.relocationCounty} />
                <Row
                  label="Buyer’s authorized agent"
                  value={`${engagement.intake.authorizedAgentName}, ${engagement.intake.authorizedAgentCompany}`}
                />
                <Row
                  label="Donor company affiliation"
                  value={engagement.intake.donorCompanyAffiliation}
                />
                {engagement.intake.donorSiteName ? (
                  <Row label="Donor site" value={engagement.intake.donorSiteName} />
                ) : null}
                <Row
                  label="Buyer witness"
                  value={`${engagement.intake.buyerWitnessName} · ${engagement.intake.buyerWitnessEmail}`}
                />
                <Row
                  label="Canaan witness (fixed)"
                  value={`${engagement.intake.sellerWitnessName} · ${engagement.intake.sellerWitnessEmail}`}
                />
              </dl>
              {engagement.intake.donorSiteDescription ? (
                <p className="mt-4 text-sm leading-7 text-ink/80">
                  {engagement.intake.donorSiteDescription}
                </p>
              ) : null}
              <RateOverrideForm engagement={engagement} />
            </section>

            <section className="rounded-2xl border border-line bg-white p-6">
              <h2 className="font-serif text-2xl text-forest">Seller (static)</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <Row label="Entity" value={brand.legalName} />
                <Row label="Brand" value={brand.name} />
                <Row label="Attention" value={brand.attention} />
                <Row label="Address" value={brand.addressLine} />
                <Row label="Signatory" value={`${brand.signatoryName}, ${brand.signatoryTitle}`} />
                <Row label="Agent" value={`${brand.agentName} / ${brand.agentContact}`} />
                <Row label="Venue" value={brand.venue} />
                <Row
                  label="Juvenile fee"
                  value={`${formatUsd(brand.juvenileAdditionalFee)} per juvenile`}
                />
                <Row label="Deposits" value="None required" />
                <Row label="FWC status" value={brand.fwcStatus} />
              </dl>
            </section>

            <section className="rounded-2xl border border-line bg-white p-6">
              <h2 className="font-serif text-2xl text-forest">Signature</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <Row label="Method" value={engagement.signingMethod ?? "Not selected"} />
                <Row
                  label="Artifact"
                  value={
                    engagement.signedArtifact
                      ? `${engagement.signedArtifact.filename} (${engagement.signedArtifact.source})`
                      : "None on file"
                  }
                />
                <Row label="DocuSign mode" value={seam.mode} />
                <Row label="Envelope" value={engagement.docusign.envelopeId ?? "—"} />
                <Row label="Envelope status" value={engagement.docusign.status} />
                {engagement.docusign.recipients.length > 0 ? (
                  <Row
                    label="Routing"
                    value={engagement.docusign.recipients
                      .map((recipient) => `${recipient.role}: ${recipient.email}`)
                      .join(" · ")}
                  />
                ) : null}
              </dl>
              {engagement.docusign.lastMessage ? (
                <p className="mt-3 text-sm leading-6 text-muted">{engagement.docusign.lastMessage}</p>
              ) : null}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a className="btn-secondary" href={`/api/engagements/${engagement.id}/contract`}>
                  Download agreement
                </a>
                {engagement.signedArtifact ? (
                  <a className="btn-secondary" href={`/api/engagements/${engagement.id}/signed`}>
                    Download signed copy
                  </a>
                ) : null}
                <Link className="btn-secondary" href={`/engagements/${engagement.id}`}>
                  Client view
                </Link>
              </div>
            </section>

            <ReviewForm engagement={engagement} />

            {engagement.reviews.length > 0 ? (
              <section className="rounded-2xl border border-line bg-white p-6">
                <h2 className="font-serif text-2xl text-forest">Decision history</h2>
                <ol className="mt-4 space-y-4">
                  {engagement.reviews.map((review) => (
                    <li key={review.reviewedAt} className="text-sm">
                      <p className="font-medium capitalize text-ink">
                        {review.decision.replace("_", " ")} · {review.reviewer}
                      </p>
                      <p className="text-muted">
                        {new Date(review.reviewedAt).toLocaleString("en-US")}
                      </p>
                      {review.note ? <p className="mt-1 text-ink/80">{review.note}</p> : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
          <ContractPreview engagement={engagement} />
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8.25rem_1fr] gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
