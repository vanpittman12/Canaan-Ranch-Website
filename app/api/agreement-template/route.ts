/**
 * Serves Van’s Word-derived blank agreement (yellow intake fill-ins).
 * Redirects to the static public PDF so Workers can serve it as an asset.
 * Populated engagement PDFs still come from generateContractPdf.
 */
export async function GET(request: Request) {
  return Response.redirect(
    new URL("/agreements/canaan-preserve-relocation-agreement-template.pdf", request.url),
    307,
  );
}
