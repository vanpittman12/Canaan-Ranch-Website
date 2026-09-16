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
  buildStubSignedFilename,
  getLiveEnvelopeStatus,
  isDocuSignEnabled,
} from "@/lib/docusign";
import { syncLiveEnvelope } from "@/lib/docusign-complete";
import {
  recordDocuSignSendFailure,
  sendDocuSignForEngagement,
  shouldSendDocuSignOnSubmit,
} from "@/lib/docusign-send";
import {
  applyDocuSignCompleted,
  applyHideFromLedger,
  applyMarkDeclined,
  applyReview,
  artifactFromUpload,
  EngagementError,
} from "@/lib/engagement";
import { persistExecutedAgreement } from "@/lib/executed-agreement";
import { generateStubSignedPdf } from "@/lib/pdf";
import {
  approveAndSendReservationLetter,
  persistReservationLetter,
} from "@/lib/reservation-letter-persist";
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

  let next;
  try {
    next = applyReview(engagement, decision, note);
    // Persist Accept before DOCX populate + DocuSign so a Worker CPU limit or
    // DocuSign 400 does not roll status back to Pending.
    await saveEngagement(next);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to record the review.",
    };
  }

  if (decision === "accept" && shouldSendDocuSignOnSubmit(next)) {
    try {
      next = await sendDocuSignForEngagement(next);
      await saveEngagement(next);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send DocuSign envelope.";
      // Keep Accepted; surface the send failure for Resend DocuSign.
      next = recordDocuSignSendFailure(next, message, "accept");
      await saveEngagement(next);
    }
  }

  if (decision === "accept") {
    next = await persistReservationLetter(
      next,
      next.status === "executed" ? "seller_sign" : "accept",
    );
    await saveEngagement(next);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
  revalidatePath(`/engagements/${engagementId}`);
  redirect(`/admin/engagements/${engagementId}`);
}

export async function resendDocuSign(
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
    return { error: "DocuSign can be resent only while the engagement is Accepted." };
  }
  if (engagement.signingMethod !== "docusign") {
    return { error: "This engagement is not on the DocuSign path." };
  }
  if (engagement.docusign.envelopeId) {
    return { error: "An envelope was already sent. Use Refresh status instead." };
  }

  try {
    const next = await sendDocuSignForEngagement(engagement);
    await saveEngagement(next);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resend DocuSign envelope.";
    await saveEngagement(recordDocuSignSendFailure(engagement, message, "resend"));
    return { error: message };
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
    const artifact = artifactFromUpload({
      filename: buildStubSignedFilename(engagement.reference),
      storedName,
      source: "docusign_stub",
      mimeType: "application/pdf",
      sizeBytes: 0,
    });
    const next = applyDocuSignCompleted(engagement, artifact);
    const bytes = await generateStubSignedPdf(next);
    await putUpload(storedName, bytes);
    const executed = {
      ...next,
      signedArtifact: {
        ...artifact,
        sizeBytes: bytes.length,
      },
    };
    await persistExecutedAgreement(executed);
    const withLetter = await persistReservationLetter(executed, "seller_sign");
    await saveEngagement(withLetter);
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

export async function approveReservationLetterSend(
  engagementId: string,
  previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previousState;
  await requireAdmin();
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }
  if (formData.get("sendReservationLetter") !== "on") {
    return { error: "Check “Send reservation letter” to email the PDF." };
  }
  if (engagement.status !== "accepted" && engagement.status !== "executed") {
    return { error: "Generate the letter after Accept or seller signature. It is not emailed until you approve send." };
  }
  if (engagement.reservationLetter.status === "sent" && engagement.reservationLetter.sentAt) {
    return {
      error: `This letter was already sent ${new Date(engagement.reservationLetter.sentAt).toLocaleString("en-US")}.`,
    };
  }

  const { engagement: next, result } = await approveAndSendReservationLetter(engagement);
  await saveEngagement(next);
  if (!result.sent) {
    return { error: result.error ?? "Unable to send the reservation letter." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
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

export async function hideEngagementFromLedger(
  engagementId: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  if (formData.get("confirmHide") !== "on") {
    return { error: "Confirm hide to remove this engagement from the review ledger." };
  }

  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }

  try {
    // Soft-hide only: keep the D1 payload, R2 artifacts, and DocuSign envelope.
    await saveEngagement(applyHideFromLedger(engagement));
  } catch (error) {
    return {
      error:
        error instanceof EngagementError
          ? error.message
          : "Unable to hide this engagement from the review ledger.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
  redirect("/admin");
}

export async function markEngagementDeclined(
  engagementId: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  if (formData.get("confirmDecline") !== "on") {
    return { error: "Confirm decline to move this engagement off the active review queue." };
  }

  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }

  try {
    // Status-only move. Keep the D1 payload, R2 artifacts, and DocuSign envelope.
    await saveEngagement(applyMarkDeclined(engagement));
  } catch (error) {
    return {
      error:
        error instanceof EngagementError
          ? error.message
          : "Unable to mark this engagement declined.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/engagements/${engagementId}`);
  redirect(`/admin/engagements/${engagementId}`);
}
