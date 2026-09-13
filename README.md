# Canaan Preserve

Professional-services intake, agreement preview, signature, and internal review for **Canaan Preserve**. The GitHub repository name may still say Canaan Ranch; customer-facing branding is Canaan Preserve.

Clients submit company and project details. The app populates a standard Canaan Preserve professional-services agreement, lets the client choose DocuSign or a manual signed PDF, and holds every engagement in a team review queue. **Nothing is executed until the team Accepts and a signed artifact is on file.**

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Path | Purpose |
| --- | --- |
| `/` | Public landing |
| `/intake` | Customer intake |
| `/engagements/[id]` | Contract preview, signing choice, status |
| `/admin/login` | Team sign-in |
| `/admin` | Review queue |

Optional environment file:

```bash
cp .env.example .env.local
```

The app runs in development without `.env.local`.

### Admin sign-in

| Variable | Development default | Production |
| --- | --- | --- |
| `ADMIN_PASSWORD` | `canaan-admin` | Required |
| `ADMIN_SESSION_SECRET` | local development secret | Required |

Sign in at `/admin/login`, then Accept / Request changes / Decline from the queue. Request changes returns the client to an editable preview. Decline is terminal. Accept is the only path toward execution.

### Useful scripts

```bash
npm run dev      # Next.js App Router, TypeScript, Turbopack
npm run build    # Production build
npm run start    # Serve the production build
npm test         # Status machine + DocuSign seam unit tests
npm run lint     # ESLint
```

## Product flow

1. Client completes intake (company, contact, project basics).
2. Submit generates a Canaan Preserve professional-services agreement and shows the preview.
3. Client chooses:
   - **DocuSign** — recorded as the signing method. The envelope is **not** sent until Accept.
   - **Manual** — download the PDF, optionally upload a signed copy, then submit.
4. Team reviews at `/admin`:
   - **Accept** — if DocuSign, send the stub envelope; if a signed file is already present, status becomes **Executed**.
   - **Request changes** — client can edit and resubmit.
   - **Decline** — closed without execution.
5. After Accept, status becomes **Executed** only when a signed artifact is present (manual upload, or the admin “Simulate DocuSign signed” stub control).

## DocuSign seam

Live DocuSign API calls are **not** made. Integration lives in [`lib/docusign.ts`](lib/docusign.ts).

| Variable | Role |
| --- | --- |
| `DOCUSIGN_ENABLED` | `true` selects the live placeholder. Default / unset uses the local stub. |
| `DOCUSIGN_INTEGRATION_KEY` | Integration key (OAuth client ID) |
| `DOCUSIGN_USER_ID` | Impersonated user GUID |
| `DOCUSIGN_ACCOUNT_ID` | Account GUID |
| `DOCUSIGN_ACCOUNT_BASE_URI` | e.g. `https://demo.docusign.net` |
| `DOCUSIGN_AUTH_SERVER` | e.g. `https://account-d.docusign.com` |
| `DOCUSIGN_PRIVATE_KEY` | RSA private key PEM for JWT grant |
| `DOCUSIGN_PRIVATE_KEY_PATH` | Alternative path to that PEM |
| `DOCUSIGN_WEBHOOK_SECRET` | For verifying Connect / webhook callbacks |
| `DOCUSIGN_RETURN_URL` | Post-sign return URL |

When `DOCUSIGN_ENABLED` is not `true`, `sendEnvelope()` stores a `stub-…` envelope ID and a clear message that no API call was made.

When `DOCUSIGN_ENABLED=true`, `sendEnvelopeLive()` is the insertion point for JWT auth and `Envelopes:create`. It still does **not** call DocuSign; it throws if you have not implemented that function. Implement it in `lib/docusign.ts` before pointing a real account at this app.

The admin engagement page includes **Simulate DocuSign signed** so the executed path can be demonstrated without a live account.

## Data

Engagements are stored in `data/engagements.json`. Uploaded and stub-signed PDFs live in `data/uploads/`. This is a single-instance local store, not a hosted database.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Zod, pdf-lib, cookie-based admin session.
