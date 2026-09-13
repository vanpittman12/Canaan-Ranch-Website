"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminActionState } from "@/app/actions/admin";

const initialState: AdminActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {state.error ? (
        <p className="rounded-xl border border-terracotta/30 bg-terracotta/8 px-4 py-3 text-sm text-terracotta">
          {state.error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-ink">Password</span>
        <input
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className="btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
