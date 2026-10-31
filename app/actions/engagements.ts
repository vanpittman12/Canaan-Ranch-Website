"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  recordDocuSignSendFailure,
  sendDocuSignForEngagement,
  shouldSendDocuSignOnSubmit,
} from "@/lib/docusign-send";
import {
  applySignedArtifact,
  applySubmit,
  artifactFromUpload,
  canCustomerEdit,
  EngagementError,
} from "@/lib/engagement";
import { persistExecutedAgreement } from "@/lib/executed-agreement";
import { persistReservationLetter } from "@/lib/reservation-letter-persist";
import { persistAndNotifyNewEngagement } from "@/lib/notify";
import {
  createEngagementRecord,
  getEngagement,
  putUpload,
  saveEngagement,
} from "@/lib/store";
import { hasPdfMagicBytes } from "@/lib/http";
import { originalFileName } from "@/lib/storage/names";
import { honeypotTripped } from "@/lib/intake-spam";
import {
  clientKey,
  INTAKE_SUBMIT_RULE,
  rateLimitStatus,
  recordRateLimitHit,
} from "@/lib/security-state";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  flattenZodErrors,
  formDataToObject,
  intakeSchema,
  publicIntakeFields,
} from "@/lib/validation";
import type { SigningMethod } from "@/lib/types";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createEngagement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawIp = (await headers()).get("cf-connecting-ip");
  const ip = clientKey(rawIp);

  // Spam trap filled: pretend success, store nothing.
  if (honeypotTripped(formData)) {
    console.warn(`[intake] honeypot tripped ip=${ip}; submission dropped`);
    redirect("/intake?received=1");
  }

  const parsed = intakeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: flattenZodErrors(parsed.error),
    };
  }

  // Checked after field validation so a field error does not burn the token.
  const human = await verifyTurnstile(formData, { remoteIp: rawIp });
  if (!human.ok) {
    return { error: human.error };
  }

  // 10 accepted submissions per IP per hour.
  const limitKey = `intake:${ip}`;
  if ((await rateLimitStatus(limitKey, INTAKE_SUBMIT_RULE)).blocked) {
    console.warn(`[intake] rate limit reached ip=${ip}`);
    return { error: "Too many submissions from this connection. Please try again later." };
  }
  await recordRateLimitHit(limitKey, INTAKE_SUBMIT_RULE);

  const engagement = await persistAndNotifyNewEngagement(() =>
    createEngagementRecord(publicIntakeFields(parsed.data)),
  );
  redirect(`/engagements/${engagement.id}`);
}

export async function updateIntake(
  engagementId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }
  if (!canCustomerEdit(engagement.status)) {
    return { error: "This engagement can no longer be edited." };
  }

  const parsed = intakeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: flattenZodErrors(parsed.error),
    };
  }

  await saveEngagement({
    ...engagement,
    intake: publicIntakeFields(parsed.data),
  });
  revalidatePath(`/engagements/${engagementId}`);
  redirect(`/engagements/${engagementId}`);
}

export async function submitEngagement(
  engagementId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }

  const method = formData.get("signingMethod");
  if (method !== "docusign" && method !== "manual") {
    return { error: "Choose DocuSign or a manual PDF signature." };
  }

  try {
    let next = applySubmit(engagement, method as SigningMethod);
    // Persist submit before populate + DocuSign so a Worker CPU limit or
    // DocuSign 400 does not roll the engagement back to Draft.
    await saveEngagement(next);
    if (shouldSendDocuSignOnSubmit(next)) {
      try {
        next = await sendDocuSignForEngagement(next);
        await saveEngagement(next);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to send DocuSign envelope.";
        next = recordDocuSignSendFailure(next, message, "intake_submit");
        await saveEngagement(next);
      }
    }
  } catch (error) {
    return {
      error: error instanceof EngagementError ? error.message : "Unable to submit.",
    };
  }

  revalidatePath(`/engagements/${engagementId}`);
  revalidatePath("/admin");
  redirect(`/engagements/${engagementId}`);
}

export async function uploadSignedCopy(
  engagementId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const engagement = await getEngagement(engagementId);
  if (!engagement) {
    return { error: "Engagement not found." };
  }
  if (engagement.status === "declined") {
    return { error: "A declined engagement cannot accept a signed copy." };
  }

  const file = formData.get("signedPdf");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a signed PDF to upload." };
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Upload a PDF file." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Signed PDFs must be 10 MB or smaller." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfMagicBytes(bytes)) {
    return { error: "That file is not a valid PDF. Upload the signed agreement as a PDF." };
  }

  const storedName = `${engagement.id}-signed.pdf`;
  await putUpload(storedName, bytes);

  const next = applySignedArtifact(
    engagement,
    artifactFromUpload({
      filename: originalFileName(file.name),
      storedName,
      source: "manual_upload",
      mimeType: "application/pdf",
      sizeBytes: file.size,
    }),
  );
  await persistExecutedAgreement(next);
  const withLetter =
    next.status === "executed"
      ? await persistReservationLetter(next, "seller_sign")
      : next;
  await saveEngagement(withLetter);

  revalidatePath(`/engagements/${engagementId}`);
  revalidatePath(`/admin/engagements/${engagementId}`);
  revalidatePath("/admin");
  redirect(`/engagements/${engagementId}`);
}
