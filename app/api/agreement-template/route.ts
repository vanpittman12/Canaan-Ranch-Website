/**
 * Serves Van’s uploaded blank agreement as a Word attachment.
 * Redirects to the static public DOCX so Workers can serve it as an asset.
 * Populated buyer download + DocuSign fill a copy of that same file.
 */
export async function GET(request: Request) {
  return Response.redirect(
    new URL(
      "/agreements/Canaan-Preserve-Relocation-Agreement-template.docx",
      request.url,
    ),
    307,
  );
}
