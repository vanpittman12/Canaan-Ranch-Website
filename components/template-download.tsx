import { TEMPLATE_AGREEMENT_PATH } from "@/lib/brand";

export function TemplateDownloadButton({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark" | "primary";
  className?: string;
}) {
  const styles =
    variant === "dark"
      ? "inline-flex items-center justify-center rounded-full border border-cream/35 px-5 py-3 text-[0.95rem] font-semibold text-cream transition hover:bg-white/10"
      : variant === "primary"
        ? "btn-primary"
        : "btn-secondary";

  return (
    <a className={`${styles} ${className}`.trim()} href={TEMPLATE_AGREEMENT_PATH}>
      Download blank agreement PDF
    </a>
  );
}
