import { getSellerWitness } from "../brand";
import type { Engagement, IntakeFields } from "../types";

export type StoredIntake = Partial<IntakeFields> & { effectiveDate?: string };

export type StoredEngagement = Omit<Engagement, "intake" | "effectiveDate" | "docusign"> & {
  effectiveDate?: string | null;
  intake: StoredIntake;
  docusign?: Partial<Omit<Engagement["docusign"], "mode">> & {
    mode?: Engagement["docusign"]["mode"] | "live_placeholder";
  };
};

export function normalizeIntake(intake: StoredIntake): IntakeFields {
  const sellerWitness = getSellerWitness();
  return {
    buyerLegalName: intake.buyerLegalName ?? "",
    buyerAttention: intake.buyerAttention ?? "",
    buyerEmail: intake.buyerEmail ?? "",
    buyerStreet: intake.buyerStreet ?? "",
    buyerCity: intake.buyerCity ?? "",
    buyerState: intake.buyerState ?? "",
    buyerPostalCode: intake.buyerPostalCode ?? "",
    buyerPhone: intake.buyerPhone ?? "",
    tortoiseCount: intake.tortoiseCount ?? 0,
    perGtRate: intake.perGtRate ?? 0,
    relocationCounty: intake.relocationCounty ?? "",
    authorizedAgentName: intake.authorizedAgentName ?? "",
    authorizedAgentCompany: intake.authorizedAgentCompany ?? "",
    donorCompanyAffiliation: intake.donorCompanyAffiliation ?? "",
    donorSiteName: intake.donorSiteName ?? "",
    donorSiteDescription: intake.donorSiteDescription ?? "",
    buyerWitnessName: intake.buyerWitnessName ?? "",
    buyerWitnessEmail: intake.buyerWitnessEmail ?? "",
    sellerWitnessName: intake.sellerWitnessName || sellerWitness.name,
    sellerWitnessEmail: intake.sellerWitnessEmail || sellerWitness.email,
  };
}

export function normalizeEngagement(raw: StoredEngagement): Engagement {
  const legacyDate = raw.intake.effectiveDate?.trim() || null;
  return {
    ...raw,
    effectiveDate: raw.effectiveDate ?? legacyDate,
    intake: normalizeIntake(raw.intake),
    docusign: {
      mode: raw.docusign?.mode === "live" || raw.docusign?.mode === "live_placeholder" ? "live" : "stub",
      envelopeId: raw.docusign?.envelopeId ?? null,
      status: raw.docusign?.status ?? "not_sent",
      sentAt: raw.docusign?.sentAt ?? null,
      completedAt: raw.docusign?.completedAt ?? null,
      lastMessage: raw.docusign?.lastMessage ?? null,
      recipients: raw.docusign?.recipients ?? [],
    },
  };
}

export function parseStoredEngagement(raw: string): Engagement {
  return normalizeEngagement(JSON.parse(raw) as StoredEngagement);
}
