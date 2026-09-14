"use client";

import { useActionState } from "react";
import { overridePerGtRate, type AdminActionState } from "@/app/actions/admin";
import { brand } from "@/lib/brand";
import type { Engagement } from "@/lib/types";

const initialState: AdminActionState = {};

export function RateOverrideForm({ engagement }: { engagement: Engagement }) {
  const action = overridePerGtRate.bind(null, engagement.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 border-t border-line pt-5">
      <p className="text-sm font-medium text-ink">Manager rate override</p>
      <p className="mt-1 text-sm text-muted">
        Adult rate defaults to {brand.defaultPerGtRate.toLocaleString("en-US")} USD. Use only for
        rare exceptions Van approves. Public intake cannot change this.
      </p>
      {state.error ? <p className="mt-2 text-sm text-terracotta">{state.error}</p> : null}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="field-control sm:max-w-40"
          type="number"
          name="perGtRate"
          min={1}
          step={1}
          defaultValue={engagement.intake.perGtRate}
          required
        />
        <button className="btn-secondary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Update rate"}
        </button>
      </div>
    </form>
  );
}
