import {
  applyReservationLetterGenerated,
  applyReservationLetterSendFailed,
  applyReservationLetterSent,
  buildReservationLetterFields,
  generateReservationLetterPdf,
  reservationLetterFilename,
  reservationLetterStoredName,
} from "./reservation-letter";
import {
  buildReservationLetterEmail,
  notifyReservationLetter,
  type NotifyHttp,
  type NotifyResult,
} from "./notify";
import { getUpload, putUpload } from "./store";
import type { Engagement, ReservationLetterSource } from "./types";

export async function persistReservationLetter(
  engagement: Engagement,
  source: ReservationLetterSource,
): Promise<Engagement> {
  try {
    const fields = buildReservationLetterFields(engagement);
    const bytes = await generateReservationLetterPdf(fields);
    const storedName = reservationLetterStoredName(engagement.id);
    const filename = reservationLetterFilename(engagement.reference);
    await putUpload(storedName, bytes);
    return applyReservationLetterGenerated(engagement, {
      storedName,
      filename,
      letterDate: fields.letterDate,
      source,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate the reservation letter.";
    console.error("[reservation-letter] generate failed", error);
    return {
      ...engagement,
      reservationLetter: {
        ...engagement.reservationLetter,
        lastError: message,
      },
    };
  }
}

export async function approveAndSendReservationLetter(
  engagement: Engagement,
  http?: NotifyHttp,
): Promise<{ engagement: Engagement; result: NotifyResult }> {
  let current = engagement;
  if (!current.reservationLetter.storedName) {
    current = await persistReservationLetter(
      current,
      current.effectiveDate ? "seller_sign" : "accept",
    );
  }
  const storedName = current.reservationLetter.storedName;
  if (!storedName) {
    const message =
      current.reservationLetter.lastError ?? "Reservation letter is not on file.";
    return {
      engagement: applyReservationLetterSendFailed(current, message),
      result: { mode: "stub", sent: false, error: message },
    };
  }

  const bytes = await getUpload(storedName);
  if (!bytes) {
    const message = "Reservation letter file is missing from storage.";
    return {
      engagement: applyReservationLetterSendFailed(current, message),
      result: { mode: "gmail", sent: false, error: message },
    };
  }

  const email = buildReservationLetterEmail({
    reference: current.reference,
    buyerLegalName: current.intake.buyerLegalName,
    buyerEmail: current.intake.buyerEmail,
    donorProjectName: current.intake.donorSiteName,
    attachment: {
      filename:
        current.reservationLetter.filename ?? reservationLetterFilename(current.reference),
      mimeType: "application/pdf",
      bytes,
    },
  });
  const result = await notifyReservationLetter(email, http);
  if (!result.sent) {
    return {
      engagement: applyReservationLetterSendFailed(
        current,
        result.error ?? "Unable to send the reservation letter.",
      ),
      result,
    };
  }
  return {
    engagement: applyReservationLetterSent(current, { notifyMode: result.mode }),
    result,
  };
}
