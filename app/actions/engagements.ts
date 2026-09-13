"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  applySignedArtifact,
  applySubmit,
  artifactFromUpload,
  canCustomerEdit,
  EngagementError,
} from "@/lib/engagement";
import {
  createEngagementRecord,
  getEngagement,
  getStoredUploadPath,
  saveEngagement,
} from "@/lib/store";
import { flattenZodErrors, formDataToObject, intakeSchema } from "@/lib/validation";
import type { SigningMethod } from "@/lib/types";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createEngagement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = intakeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: flattenZodErrors(parsed.error),
    };
  }

  const engagement = await createEngagementRecord(parsed.data);
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
    intake: parsed.data,
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
    const next = applySubmit(engagement, method as SigningMethod);
    await saveEngagement(next);
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

  const storedName = `${engagement.id}-signed.pdf`;
  const dest = getStoredUploadPath(storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, bytes);

  const next = applySignedArtifact(
    engagement,
    artifactFromUpload({
      filename: path.basename(file.name) || storedName,
      storedName,
      source: "manual_upload",
      mimeType: "application/pdf",
      sizeBytes: file.size,
    }),
  );
  await saveEngagement(next);

  revalidatePath(`/engagements/${engagementId}`);
  revalidatePath(`/admin/engagements/${engagementId}`);
  revalidatePath("/admin");
  redirect(`/engagements/${engagementId}`);
}
