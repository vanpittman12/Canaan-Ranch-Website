/**
 * Serves Van’s uploaded blank agreement as a Word attachment.
 * Redirects to the static public DOCX so Workers can serve it as an asset.
 * Populated engagement PDFs still come from generateContractPdf.
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
