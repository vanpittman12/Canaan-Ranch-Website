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
      ? "btn-secondary border-cream/35 bg-transparent text-cream"
      : variant === "primary"
        ? "btn-primary"
        : "btn-secondary";

  return (
    <a className={`${styles} ${className}`.trim()} href={TEMPLATE_AGREEMENT_PATH}>
      Download blank agreement
    </a>
  );
}
