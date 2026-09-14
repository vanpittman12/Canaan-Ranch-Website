export function DocumentDesk({
  contractUrl,
  signedUrl,
  reference,
}: {
  contractUrl: string;
  signedUrl?: string | null;
  reference: string;
}) {
  return (
    <section className="surface-card border-forest/25">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
        Document desk
      </p>
      <h2 className="type-h2 mt-2 text-forest">Download the populated agreement</h2>
      <p className="mt-2 text-[17px] leading-[27px] text-muted">
        {reference} is ready as a PDF. There is no on-screen contract preview. Download first,
        then choose a signing path.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a className="btn-primary" href={contractUrl}>
          Download populated agreement PDF
        </a>
        {signedUrl ? (
          <a className="btn-secondary" href={signedUrl}>
            Download signed copy
          </a>
        ) : null}
      </div>
    </section>
  );
}
