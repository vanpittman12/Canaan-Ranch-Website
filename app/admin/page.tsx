import Link from "next/link";
import { logoutAdmin, requireAdmin } from "@/app/actions/admin";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { describeDocuSignSeam } from "@/lib/docusign";
import { listEngagements } from "@/lib/store";
import { STATUS_LABELS, type EngagementStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = (status ?? "all") as EngagementStatus | "all";
  const engagements = await listEngagements();
  const visible =
    filter === "all" ? engagements : engagements.filter((item) => item.status === filter);
  const pendingCount = engagements.filter((item) => item.status === "pending_review").length;
  const seam = describeDocuSignSeam();

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader variant="admin" />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
              Internal
            </p>
            <h1 className="mt-2 font-serif text-4xl text-forest">Review queue</h1>
            <p className="mt-2 text-sm text-muted">
              {pendingCount} awaiting a decision. Nothing closes without Accept. DocuSign is in{" "}
              {seam.mode} mode and does not make live API calls.
            </p>
          </div>
          <form action={logoutAdmin}>
            <button className="btn-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <FilterLink href="/admin" active={filter === "all"} label="All" />
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
              active={filter === value}
              label={STATUS_LABELS[value]}
            />
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
          {visible.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-serif text-2xl text-forest">The queue is clear.</p>
              <p className="mt-2 text-sm text-muted">
                New client intake submissions will appear here for Accept, request changes, or
                decline.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-cream/70 text-[11px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">Project</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Signing</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-5 py-4">
                      <Link
                        className="font-medium text-forest underline-offset-2 hover:underline"
                        href={`/admin/engagements/${item.id}`}
                      >
                        {item.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div>{item.intake.companyName}</div>
                      <div className="text-muted">{item.intake.contactName}</div>
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">{item.intake.projectTitle}</td>
                    <td className="hidden px-5 py-4 capitalize text-muted lg:table-cell">
                      {item.signingMethod ?? "—"}
                      {item.signedArtifact ? " · signed file" : ""}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
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
      className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
        active ? "bg-forest text-cream" : "bg-white text-muted ring-1 ring-line"
      }`}
    >
      {label}
    </Link>
  );
}
