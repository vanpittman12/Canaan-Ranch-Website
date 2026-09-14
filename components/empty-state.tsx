import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="type-h2 text-forest">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-[17px] leading-[27px] text-muted">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
