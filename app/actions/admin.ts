"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  createAdminSession,
  passwordsMatch,
  sessionCookieOptions,
  verifyAdminSession,
} from "@/lib/auth";
import {
  sendEnvelope,
  buildStubSignedFilename,
  buildEnvelopeRecipients,
  getLiveEnvelopeStatus,
  isDocuSignEnabled,
} from "@/lib/docusign";
import { syncLiveEnvelope } from "@/lib/docusign-complete";
import {
  applyDocuSignCompleted,
  applyDocuSignSent,
  applyReview,
  artifactFromUpload,
  EngagementError,
} from "@/lib/engagement";
import { generatePopulatedAgreement } from "@/lib/agreement-populate";
import { generateStubSignedPdf } from "@/lib/pdf";
import { getEngagement, putUpload, saveEngagement } from "@/lib/store";
import type { ReviewDecision } from "@/lib/types";

export type AdminActionState = {
  error?: string;
};

export async function requireAdmin() {
  const jar = await cookies();
  if (!(await verifyAdminSession(jar.get(ADMIN_COOKIE)?.value))) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const password = String(formData.get("password") ?? "");
  if (!passwordsMatch(password)) {
    return { error: "That password is not recognized." };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await createAdminSession(), sessionCookieOptions());
  redirect("/admin");
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function reviewEngagement(
  engagementId: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }

  const decision = String(formData.get("decision") ?? "") as ReviewDecision;
  if (!["accept", "request_changes", "decline"].includes(decision)) {
    return { error: "Choose a valid review decision." };
  }

  const note = String(formData.get("note") ?? "");

  try {
    let next = applyReview(engagement, decision, note);
    // Persist Accept before DOCX populate + DocuSign so a Worker CPU limit on
    // regenerate does not leave the engagement stuck in Pending.
    await saveEngagement(next);
    if (decision === "accept" && next.signingMethod === "docusign") {
      const populated = await generatePopulatedAgreement(next);
      const sent = await sendEnvelope({
        engagementId: next.id,
        reference: next.reference,
        recipients: buildEnvelopeRecipients(next.intake),
        document: {
          name: populated.filename,
          bytes: populated.bytes,
          fileExtension: populated.fileExtension,
        },
      });
      next = applyDocuSignSent(
        next,
        sent.envelopeId,
        sent.message,
        sent.mode,
        sent.recipients,
      );
      await saveEngagement(next);
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to record the review.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
  revalidatePath(`/engagements/${engagementId}`);
  redirect(`/admin/engagements/${engagementId}`);
}

export async function simulateDocuSignComplete(
  engagementId: string,
  previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previousState;
  void formData;
  await requireAdmin();
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }
  if (engagement.status !== "accepted") {
    return { error: "DocuSign completion can be simulated only after accept." };
  }
  if (engagement.signingMethod !== "docusign") {
    return { error: "This engagement is not on the DocuSign path." };
  }
  if (!engagement.docusign.envelopeId) {
    return { error: "No envelope has been sent yet." };
  }

  try {
    const storedName = `${engagement.id}-signed.pdf`;
    const bytes = await generateStubSignedPdf(engagement);
    await putUpload(storedName, bytes);

    const next = applyDocuSignCompleted(
      engagement,
      artifactFromUpload({
        filename: buildStubSignedFilename(engagement.reference),
        storedName,
        source: "docusign_stub",
        mimeType: "application/pdf",
        sizeBytes: bytes.length,
      }),
    );
    await saveEngagement(next);
  } catch (error) {
    return {
      error:
        error instanceof EngagementError
          ? error.message
          : "Unable to simulate DocuSign completion.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
  revalidatePath(`/engagements/${engagementId}`);
  redirect(`/admin/engagements/${engagementId}`);
}

export async function refreshDocuSignStatus(
  engagementId: string,
  previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previousState;
  void formData;
  await requireAdmin();
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }
  if (engagement.status !== "accepted" && engagement.status !== "executed") {
    return { error: "Envelope status can be refreshed only after accept." };
  }
  if (engagement.signingMethod !== "docusign") {
    return { error: "This engagement is not on the DocuSign path." };
  }
  if (!engagement.docusign.envelopeId) {
    return { error: "No envelope has been sent yet." };
  }
  if (!isDocuSignEnabled() || engagement.docusign.mode !== "live") {
    return { error: "Live envelope polling is available only when DOCUSIGN_ENABLED=true." };
  }

  try {
    const snapshot = await getLiveEnvelopeStatus(engagement.docusign.envelopeId);
    await syncLiveEnvelope(engagement, snapshot.status);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to refresh DocuSign status.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
  revalidatePath(`/engagements/${engagementId}`);
  redirect(`/admin/engagements/${engagementId}`);
}

export async function overridePerGtRate(
  engagementId: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }
  const rate = Number(formData.get("perGtRate"));
  if (!Number.isFinite(rate) || rate < 1) {
    return { error: "Enter a valid per-GT rate." };
  }

  await saveEngagement({
    ...engagement,
    intake: { ...engagement.intake, perGtRate: Math.round(rate) },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
  revalidatePath(`/engagements/${engagementId}`);
  redirect(`/admin/engagements/${engagementId}`);
}
