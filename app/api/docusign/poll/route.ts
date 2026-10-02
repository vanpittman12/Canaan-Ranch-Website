import { CRON_AUTH_HEADER, isValidCronAuth } from "@/lib/cron-auth";
import { pollOpenEnvelopes } from "@/lib/docusign-refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Backup poll for open DocuSign envelopes. Called every 15 minutes by the
 * Worker cron (`worker.ts` → scheduled) with an internal HMAC header.
 */
export async function POST(request: Request) {
  const ok = await isValidCronAuth(
    request.headers.get(CRON_AUTH_HEADER),
    process.env.ADMIN_SESSION_SECRET,
  );
  if (!ok) {
    return new Response("Not found.", { status: 404 });
  }
  const summary = await pollOpenEnvelopes();
  console.log("[docusign-poll]", JSON.stringify(summary));
  return Response.json(summary);
}
