interface CloudflareEnv {
  ENGAGEMENTS: {
    prepare(query: string): {
      bind(...values: unknown[]): this;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
    };
    batch(statements: unknown[]): Promise<unknown>;
  };
  UPLOADS: {
    put(
      key: string,
      value: ArrayBuffer | ArrayBufferView,
      options?: { httpMetadata?: { contentType?: string } },
    ): Promise<unknown>;
    get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  };
  ASSETS?: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
  WORKER_SELF_REFERENCE?: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
  STORAGE_ADAPTER?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  CANAAN_WITNESS_NAME?: string;
  CANAAN_WITNESS_EMAIL?: string;
  DOCUSIGN_ENABLED?: string;
  DOCUSIGN_INTEGRATION_KEY?: string;
  DOCUSIGN_SECRET_KEY?: string;
  DOCUSIGN_USER_ID?: string;
  DOCUSIGN_ACCOUNT_ID?: string;
  DOCUSIGN_ACCOUNT_BASE_URI?: string;
  DOCUSIGN_AUTH_SERVER?: string;
  DOCUSIGN_PRIVATE_KEY?: string;
  DOCUSIGN_PRIVATE_KEY_PATH?: string;
  DOCUSIGN_WEBHOOK_SECRET?: string;
  DOCUSIGN_WEBHOOK_URL?: string;
  DOCUSIGN_RETURN_URL?: string;
  APP_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  NOTIFY_NEW_ENGAGEMENT_TO?: string;
}
