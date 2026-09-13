# Canaan Preserve

Gopher tortoise recipient-site intake, relocation agreement preview, signature, and internal review. Customer-facing brand is **Canaan Preserve**. The contracting entity is **Canaan Ranch LLP**. The GitHub repository name may still say Canaan Ranch.

Buyer intake populates a **Multi-Project Gopher Tortoise Relocation Agreement**. The client then chooses DocuSign or a manual signed PDF. **Nothing is executed until the team Accepts and a signed artifact is on file.**

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Path | Purpose |
| --- | --- |
| `/` | Public landing |
| `/intake` | Buyer intake |
| `/engagements/[id]` | Agreement preview, signing choice, status |
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

Sign in at `/admin/login`, then Accept / Request changes / Decline from the queue. Managers can override the per-GT rate for rare exceptions.

### Useful scripts

```bash
npm run dev      # Next.js App Router, TypeScript, Turbopack
npm run build    # Production build
npm run start    # Serve the production build
npm test         # Status machine, economics, and agreement mapping tests
npm run lint     # ESLint
```

## Intake → agreement mapping

| Intake / record | Agreement |
| --- | --- |
| Buyer legal name | Buyer party |
| Buyer notice (attention / signatory, street, city/state/zip, phone, email) | Notices and Buyer signature block |
| Number of spots (tortoise count) | Paragraph 2 “up to N” reserved capacity |
| Per GT Rate (default $6,000; admin override only) | Payment paragraph (words + numbers) |
| Tortoise count × rate | Total Estimated Payment (words + numbers) |
| County of relocation | Reserved-capacity paragraph |
| Authorized agent name + company | Parties, notices, Buyer responsibilities |
| Donor company affiliation | Reserved-capacity paragraph |
| Optional donor site / description | Reserved-capacity paragraph |
| Buyer witness name + email | Buyer signature block (1 witness) + DocuSign routing |
| Canaan Ranch LLP witness name + email | Seller signature block (1 witness) + DocuSign routing |
| Effective Date (not on the form) | Date the Buyer signs (DocuSign completion or manual signed-copy upload) |
| Effective Date + 1 year | Expiration Date (filled once signed) |

Seller-side constants (not buyer intake): Canaan Ranch LLP; Attention Van Pittman; 1700 S. MacDill Ave., Suite 340, Tampa, FL 33629; Phone 813-390-1044; signatory Andrew V. Pittman, Jr., Manager; agent Applied Bionomics, LLC / Andrew Fuddy; juvenile additional fee $3,000 at delivery/acceptance; venue Pasco County, Florida.

Adult vs juvenile is not collected at intake. The $3,000 juvenile additional fee stays in the agreement body. There is no initial deposit / Initial Payment step.

## Product flow

1. Buyer completes intake (legal name, notice / signatory, spots, project/ops fields, one witness per party).
2. Submit generates the Multi-Project Gopher Tortoise Relocation Agreement and shows the preview.
3. Usual path is **DocuSign** after review (witness emails are recorded on the stub envelope routing). Manual PDF remains a fallback.
4. Team reviews at `/admin`:
   - **Accept** — if DocuSign, send the stub envelope; if a signed file is already present, status becomes **Executed**.
   - **Request changes** — buyer can edit and resubmit.
   - **Decline** — closed without execution.
5. After Accept, status becomes **Executed** only when a signed artifact is present (manual upload, or the admin “Simulate DocuSign signed” stub control). The Effective Date is stamped from that signature completion.

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

When `DOCUSIGN_ENABLED=true`, `sendEnvelopeLive()` is the insertion point for JWT auth and `Envelopes:create`. It still does **not** call DocuSign; it throws if you have not implemented that function.

## Data

Engagements are stored in `data/engagements.json`. Uploaded and stub-signed PDFs live in `data/uploads/`. This is a single-instance local store, not a hosted database.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Zod, pdf-lib, cookie-based admin session.
