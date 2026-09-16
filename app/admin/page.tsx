import Link from "next/link";
import { logoutAdmin, requireAdmin } from "@/app/actions/admin";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { describeDocuSignSeam } from "@/lib/docusign";
import { HideFromLedgerForm } from "@/components/hide-from-ledger-form";
import { listEngagements } from "@/lib/store";
import { isAwaitingSellerSignature, reviewLedgerItems } from "@/lib/engagement";
import {
  LETTER_STATUS_LABELS,
  STATUS_PILL_LABELS,
  type Engagement,
  type EngagementStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; archived?: string }>;
}) {
  await requireAdmin();
  const { status, archived } = await searchParams;
  const showHidden = archived === "1";
  const filter = (status ?? "all") as EngagementStatus | "all";
  const engagements = await listEngagements();
  const ledger = reviewLedgerItems(engagements, { includeHidden: showHidden });
  const visible =
    showHidden || filter === "all"
      ? ledger
      : ledger.filter((item) => item.status === filter);
  const activeCountBase = reviewLedgerItems(engagements);
  const pendingCount = activeCountBase.filter((item) => item.status === "pending_review").length;
  const awaitingSellerCount = activeCountBase.filter((item) =>
    isAwaitingSellerSignature(item.status),
  ).length;
  const seam = describeDocuSignSeam();

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader variant="admin" />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
              Internal
            </p>
            <h1 className="type-h1 mt-2 text-forest">Review ledger</h1>
            <p className="mt-2 text-sm text-muted">
              {pendingCount} awaiting a decision. {awaitingSellerCount} awaiting seller
              signature. DocuSign goes out when the buyer submits — Accept is not required to
              start signing. The deal stays pending until Van/seller signs. DocuSign is in{" "}
              {seam.mode} mode
              {seam.makesNetworkCalls
                ? " and sends live envelopes on intake submit."
                : " (local stub — no live API calls)."}
            </p>
          </div>
          <form action={logoutAdmin}>
            <button className="btn-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <div className="pill-row mt-8">
          <FilterLink href="/admin" active={!showHidden && filter === "all"} label="All" />
          {(
            [
              "pending_review",
              "changes_requested",
              "accepted",
              "executed",
              "declined",
              "draft",
            ] as EngagementStatus[]
          ).map((value) => (
            <FilterLink
              key={value}
              href={`/admin?status=${value}`}
              active={!showHidden && filter === value}
              label={STATUS_PILL_LABELS[value]}
            />
          ))}
          <FilterLink
            href="/admin?archived=1"
            active={showHidden}
            label="Hidden"
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-[16px] border border-line bg-white">
          {visible.length === 0 ? (
            <EmptyState
              title={showHidden ? "No hidden engagements." : "The ledger is clear."}
              body={
                showHidden
                  ? "Hidden deals stay on file in D1 and R2. They are omitted from the default ledger."
                  : "New client intake submissions will appear here for Accept, request changes, or decline."
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-cream text-[12px] uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reference</th>
                      <th className="px-4 py-3 font-semibold">Buyer</th>
                      <th className="px-4 py-3 font-semibold">County</th>
                      <th className="px-4 py-3 font-semibold">GT</th>
                      <th className="px-4 py-3 font-semibold">Signing</th>
                      <th className="px-4 py-3 font-semibold">Letter</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Ledger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => (
                      <LedgerRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {visible.map((item) => (
                  <li key={item.id} className="px-4 py-4">
                    <Link href={`/admin/engagements/${item.id}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-forest">{item.reference}</p>
                          <p className="mt-1 text-sm text-ink">{item.intake.buyerLegalName}</p>
                          <p className="text-sm text-muted">
                            {item.intake.relocationCounty} · {item.intake.tortoiseCount} GT ·{" "}
                            {item.signingMethod ?? "unsigned"} ·{" "}
                            {LETTER_STATUS_LABELS[item.reservationLetter.status]}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    </Link>
                    <div className="mt-3">
                      <HideFromLedgerForm
                        engagementId={item.id}
                        archivedAt={item.archivedAt}
                        variant="compact"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function LedgerRow({ item }: { item: Engagement }) {
  return (
    <tr className="border-t border-line">
      <td className="px-4 py-3">
        <Link
          className="font-medium text-forest underline-offset-2 hover:underline"
          href={`/admin/engagements/${item.id}`}
        >
          {item.reference}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div>{item.intake.buyerLegalName}</div>
        <div className="text-muted">{item.intake.buyerAttention}</div>
      </td>
      <td className="px-4 py-3">{item.intake.relocationCounty}</td>
      <td className="px-4 py-3">{item.intake.tortoiseCount}</td>
      <td className="px-4 py-3 capitalize text-muted">
        {item.signingMethod ?? "—"}
        {item.signedArtifact ? " · file" : ""}
      </td>
      <td className="px-4 py-3 text-muted">
        {LETTER_STATUS_LABELS[item.reservationLetter.status]}
        {item.reservationLetter.sentAt
          ? ` · ${new Date(item.reservationLetter.sentAt).toLocaleDateString("en-US")}`
          : ""}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3">
        <HideFromLedgerForm
          engagementId={item.id}
          archivedAt={item.archivedAt}
          variant="compact"
        />
      </td>
    </tr>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`status-pill min-h-11 ${
        active ? "bg-forest text-cream" : "border border-line bg-white text-muted"
      }`}
    >
      {label}
    </Link>
  );
}
