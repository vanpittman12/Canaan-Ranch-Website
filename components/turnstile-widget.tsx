"use client";

import { useEffect, useRef, useState } from "react";
import { TURNSTILE_RESPONSE_FIELD, TURNSTILE_SITE_KEY } from "@/lib/turnstile-config";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      "response-field"?: boolean;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () =>
        window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing"));
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("turnstile script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * "Verify you're human" widget. Renders nothing until a site key is configured.
 * `resetKey` changes (e.g. a new action result) reset the single-use token.
 */
export function TurnstileWidget({
  action,
  resetKey,
  className,
}: {
  action: string;
  resetKey?: unknown;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !container.current) {
      return;
    }
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current || widgetId.current) {
          return;
        }
        widgetId.current = api.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: "light",
          "response-field": false,
          callback: (value) => setToken(value),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      })
      .catch((error) => {
        console.warn("[turnstile]", error instanceof Error ? error.message : error);
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, [action]);

  useEffect(() => {
    if (resetKey === undefined || !widgetId.current || !window.turnstile) {
      return;
    }
    window.turnstile.reset(widgetId.current);
    setToken("");
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div className={className} data-turnstile="true">
      <div ref={container} />
      <input type="hidden" name={TURNSTILE_RESPONSE_FIELD} value={token} />
    </div>
  );
}
