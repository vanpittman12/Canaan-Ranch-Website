"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminActionState } from "@/app/actions/admin";

const initialState: AdminActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {state.error ? (
        <p className="rounded-[12px] border border-terracotta/30 bg-white px-4 py-3 text-sm text-terracotta">
          {state.error}
        </p>
      ) : null}
      <label className="block" htmlFor="password">
        <span className="type-label">Password</span>
        <input
          id="password"
          className="field-control"
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
