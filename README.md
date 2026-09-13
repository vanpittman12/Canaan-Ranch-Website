# Canaan Preserve

Gopher tortoise recipient-site intake, downloadable relocation agreement, signature, and internal review. Customer-facing brand is **Canaan Preserve**. The contracting entity is **Canaan Ranch LLP**. The GitHub repository name may still say Canaan Ranch.

**Canaan Preserve is an FWC Approved Tier 1 Long Term Recipient site.**

Buyer intake populates a **Multi-Project Gopher Tortoise Relocation Agreement**. After intake the buyer **downloads** the populated PDF to review (there is no on-screen contract preview). The client then chooses DocuSign or a manual signed PDF. **Nothing is executed until the team Accepts and a signed artifact is on file.**

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
| `/api/agreement-template` | Blank / template agreement PDF |
| `/engagements/[id]` | Download populated PDF, signing choice, status |
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

Sign in at `/admin/login`, then Accept / Request changes / Decline from the queue. Managers can override the adult (per-GT) rate for rare exceptions. Public intake cannot override the rate.

### Canaan Ranch LLP witness

Seller-side, the same every time, and **not** on the public intake form.

| Variable | Default |
| --- | --- |
| `CANAAN_WITNESS_NAME` | `Andrew Fuddy` |
| `CANAAN_WITNESS_EMAIL` | `witness@canaanpreserve.com` |

DocuSign stub routing still includes this fixed witness.

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
| Buyer notice (attention / signatory, street, city/state/zip, phone, email) | Parties + Notices (“Buyer’s notice address”) and Buyer signature name |
| Reserved capacity (tortoise count) | Paragraph 2 “up to N” reserved capacity |
| Adult rate (locked to $6,000 on public intake; admin override only) | Payment paragraph: $6,000 per adult (words + numbers) |
| Tortoise count × adult rate | Total Estimated Payment at the adult rate (words + numbers) |
| County of relocation | Reserved-capacity paragraph (“County of relocation”) |
| Buyer’s authorized agent name + company | Parties, Notices, Buyer responsibilities |
| Donor company affiliation | Reserved-capacity paragraph (“Donor company affiliation”) |
| Optional donor site / description | Reserved-capacity paragraph |
| Buyer witness name + email | Buyer signature block (1 witness) + DocuSign routing |
| Canaan Ranch LLP witness (brand/config, not intake) | Seller signature block (1 witness) + DocuSign routing |
| Effective Date (not on the form) | Date the Buyer signs (DocuSign completion or manual signed-copy upload) |
| Effective Date + 1 year | Expiration Date (filled once signed) |

Seller-side constants (not buyer intake): Canaan Ranch LLP; Attention Van Pittman; 1700 S. MacDill Ave., Suite 340, Tampa, FL 33629; Phone 813-390-1044; signatory Andrew V. Pittman, Jr., Manager; agent Applied Bionomics, LLC / Andrew Fuddy; Canaan witness (env-overridable); $6,000 per adult; $3,000 per juvenile at delivery/acceptance; no deposits; venue Pasco County, Florida.

Adult vs juvenile is not collected at intake. The $3,000 juvenile fee stays in the agreement body. There is no Initial Payment or deposit — reservation is the signed agreement plus tortoise count, and payment is the adult rate invoiced on acceptance.

## Product flow

1. Buyer may download the blank agreement template from the landing page or intake.
2. Buyer completes intake (legal name, notice / signatory, reserved capacity, project/ops fields, Buyer witness only).
3. Submit generates the Multi-Project Gopher Tortoise Relocation Agreement. The buyer downloads the populated PDF to review.
4. Usual path is **Accept, then DocuSign** (Buyer witness email plus the fixed Canaan witness are recorded on the stub envelope routing). Manual PDF remains a fallback. Contract and signed PDFs require an admin session or a short-lived signed download token — they are not served by engagement UUID alone.
5. Team reviews at `/admin`:
   - **Accept** — if DocuSign, send the stub envelope; if a signed file is already present, status becomes **Executed**.
   - **Request changes** — buyer can edit and resubmit.
   - **Decline** — closed without execution.
6. After Accept, status becomes **Executed** only when a signed artifact is present (manual upload, or the admin “Simulate DocuSign signed” stub control). The Effective Date is stamped from that signature completion.

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
