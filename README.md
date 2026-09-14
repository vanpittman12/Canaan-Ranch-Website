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
| `/api/agreement-template` | Blank / template agreement PDF (Van’s original Word contract, yellow intake blanks — not the `lib/contract.ts` form) |
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

DocuSign routing always includes this fixed witness (stub and live).

### Useful scripts

```bash
npm run dev              # Next.js App Router, TypeScript, Turbopack (file store)
npm run build            # Production build
npm run start            # Serve the production build
npm test                 # Status machine, economics, and agreement mapping tests
npm run lint             # ESLint
npm run preview          # OpenNext build + local Workers runtime (D1 + R2)
npm run deploy           # OpenNext build + deploy to Cloudflare Workers
npm run db:migrate       # Apply D1 migrations to the remote database
npm run db:migrate:local # Apply D1 migrations to the local preview database
npm run cf:provision     # Create D1 + R2 and write the database id into wrangler.jsonc
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

Seller-side constants (not buyer intake): Canaan Ranch LLP; Attention Van Pittman; 1700 S. MacDill Ave., Suite 340, Tampa, FL 33629; Phone 813-390-1044; signatory Andrew V. Pittman, Jr., Manager; agent Applied Bionomics, LLC / Andrew Fuddy; Canaan witness (env-overridable); $6,000 per adult; $3,000 per juvenile all-in (not added to the adult rate) at delivery/acceptance; no deposits; venue Pasco County, Florida.

Adult vs juvenile is not collected at intake. The $3,000 juvenile price stays in the agreement body as the total for a juvenile, in lieu of the $6,000 adult Per GT Rate. There is no Initial Payment or deposit — reservation is the signed agreement plus tortoise count, and payment is invoiced on acceptance.

## Product flow

1. Buyer may download the blank agreement template from the landing page or intake.
2. Buyer completes intake (legal name, notice / signatory, reserved capacity, project/ops fields, Buyer witness only).
3. Submit generates the Multi-Project Gopher Tortoise Relocation Agreement. The buyer downloads the populated PDF to review. A successful public create also calls `notifyNewEngagement` so Van is emailed (intake still succeeds if that send fails).
4. Usual path is **Accept, then DocuSign**. After Accept the envelope goes to the Buyer signer, Canaan Ranch LLP signer, the Buyer witness from intake, and the fixed Canaan witness. Manual PDF remains a fallback. Contract and signed PDFs require an admin session or a short-lived signed download token — they are not served by engagement UUID alone.
5. Team reviews at `/admin`:
   - **Accept** — if DocuSign, send the envelope (live API when `DOCUSIGN_ENABLED=true`, otherwise the local stub); if a signed file is already present, status becomes **Executed**.
   - **Request changes** — buyer can edit and resubmit.
   - **Decline** — closed without execution.
6. After Accept, status becomes **Executed** only when a signed artifact is present (manual upload, DocuSign Connect / polling when live, or the admin “Simulate DocuSign signed” stub control). The Effective Date is stamped from that signature completion.

## New-engagement email

After a **public intake create** succeeds, [`lib/notify.ts`](lib/notify.ts) `notifyNewEngagement` emails Van. The intake response is never blocked by a notify failure — errors are logged and the buyer still lands on the new engagement.

| Field | Value |
| --- | --- |
| Primary To | `vpittman@beachparkcap.com` |
| Also To | `engagements@canaanpreserve.com` (brand inbox) |
| Body | Engagement reference, buyer legal name, relocation county, tortoise count, admin review link (`/admin/engagements/[id]`) |

**Provider: Resend** (HTTPS `POST https://api.resend.com/emails`). SMTP is not used — this app runs on Cloudflare Workers, which do not have reliable outbound SMTP. No extra npm package; the seam uses `fetch` like the DocuSign live path.

| Variable | Role |
| --- | --- |
| `RESEND_API_KEY` | Enables live send. Unset / empty = console stub (local and `npm run dev`). **Cloudflare secret** — never commit. |
| `RESEND_FROM_EMAIL` | Optional From. Default `Canaan Preserve <engagements@canaanpreserve.com>`. Must be a domain verified in Resend. **Cloudflare secret** if set. |
| `NOTIFY_NEW_ENGAGEMENT_TO` | Optional primary recipient override. Default `vpittman@beachparkcap.com`. The brand inbox is still included. |
| `APP_URL` | Public origin for the admin review link. Workers `vars` default is `https://canaanpreserve.com`. Locally, falls back to the origin of `DOCUSIGN_RETURN_URL`, then `http://localhost:3000`. |

```bash
npx wrangler secret put RESEND_API_KEY
# optional:
npx wrangler secret put RESEND_FROM_EMAIL
```

## DocuSign seam

Integration lives in [`lib/docusign.ts`](lib/docusign.ts). Code reads credentials from the environment only — never commit secrets.

When `DOCUSIGN_ENABLED` is not `true` (default), `sendEnvelope()` stores a `stub-…` envelope ID and makes **no** DocuSign API call. The admin **Simulate DocuSign signed** control still works for testing.

When `DOCUSIGN_ENABLED=true`, Accept sends a live envelope: JWT grant, then `Envelopes:create` with the populated agreement PDF. Connect (`POST /api/docusign/webhook`) and polling (`Refresh envelope status`, plus `GET /api/docusign/return?engagementId=…`) mark the engagement executed when DocuSign reports completed.

### Recipient roles

| Role | Source | DocuSign routing |
| --- | --- | --- |
| `buyer_signer` | Intake: Buyer attention + email | Routing order 1 |
| `buyer_witness` | Intake: Buyer witness name + email | Routing order 2 |
| `seller_signer` | Brand: Andrew V. Pittman, Jr. / `engagements@canaanpreserve.com` | Routing order 3 |
| `seller_witness` | Brand/env: Andrew Fuddy / `witness@canaanpreserve.com` (not on the public form) | Routing order 4 |

The populated engagement PDF is the envelope document. Hidden anchor strings (`/sn_buyer/`, `/wit_buyer/`, `/sn_seller/`, `/wit_seller/`) place Sign Here and Date Signed tabs.

### Environment variables

| Variable | Role |
| --- | --- |
| `DOCUSIGN_ENABLED` | `true` selects live send. Default / unset uses the local stub. |
| `DOCUSIGN_INTEGRATION_KEY` | Integration Key (OAuth client ID) from the developer app |
| `DOCUSIGN_SECRET_KEY` | Developer-app Secret Key (confidential client). Store it; JWT send still needs an RSA private key. |
| `DOCUSIGN_USER_ID` | Impersonated user’s API Username (GUID). Env / Cloudflare secret only — never commit the value. |
| `DOCUSIGN_ACCOUNT_ID` | API Account ID (GUID). Env / Cloudflare secret only — never commit the value. |
| `DOCUSIGN_ACCOUNT_BASE_URI` | Default `https://demo.docusign.net` |
| `DOCUSIGN_AUTH_SERVER` | Default `https://account-d.docusign.com` |
| `DOCUSIGN_PRIVATE_KEY` | RSA private key PEM for JWT grant (preferred on Workers) |
| `DOCUSIGN_PRIVATE_KEY_PATH` | Local-only path to that PEM |
| `DOCUSIGN_WEBHOOK_SECRET` | DocuSign Connect HMAC key for `/api/docusign/webhook` |
| `DOCUSIGN_WEBHOOK_URL` | Optional Connect URL. If unset, derived as `{origin}/api/docusign/webhook` from `DOCUSIGN_RETURN_URL` |
| `DOCUSIGN_RETURN_URL` | Post-sign return, e.g. `https://canaanpreserve.com/api/docusign/return` |

Copy [`.env.example`](.env.example) to `.env.local` for Node. Copy [`.dev.vars.example`](.dev.vars.example) to `.dev.vars` for `npm run preview`. Do not commit either file.

### Where to find IDs in DocuSign admin

Van already has the **Integration Key** and **Secret Key** from the developer app. **User ID** and **Account ID** (when forwarded) go into Cloudflare secrets or local `.env.local` / `.dev.vars` only. Do not paste those GUIDs into git, client bundles, or `.env.example`.

To find the IDs in DocuSign admin:

1. Sign in at [https://account-d.docusign.com](https://account-d.docusign.com) (demo) or [https://account.docusign.com](https://account.docusign.com) (production).
2. Open **Settings → Apps and Keys** (Admin).
3. **API Account ID** at the top of that page → inject as `DOCUSIGN_ACCOUNT_ID`.
4. **User ID** for the impersonated sender (same page, or **Users** → the user → **API Username**) → inject as `DOCUSIGN_USER_ID`.
5. On the same Integration Key, add an **RSA keypair** (Service Integration / JWT). Put the **private** PEM in `DOCUSIGN_PRIVATE_KEY`. The developer-app Secret Key is not the JWT key.
6. Grant JWT consent once (the live send error will include the consent URL if this step is missing): scope `signature impersonation`.
7. In **Connect**, add an HMAC key and a webhook to `https://canaanpreserve.com/api/docusign/webhook` (envelope completed). Store the HMAC key as `DOCUSIGN_WEBHOOK_SECRET`.

## Data

Storage is selected by `STORAGE_ADAPTER`:

| Value | Used when | Engagements | Signed PDFs |
| --- | --- | --- | --- |
| `file` (default) | `npm run dev` / `npm run start` | `data/engagements.json` | `data/uploads/` |
| `cloudflare` | Workers deploy and `npm run preview` | Cloudflare D1 (`ENGAGEMENTS`) | Cloudflare R2 (`UPLOADS`) |

`npm run dev` stays on the file store unless you set `STORAGE_ADAPTER=cloudflare` in `.env.local`. Product behavior is the same on both adapters.

## Deploy to Cloudflare (`canaanpreserve.com`)

The app runs on **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`). It is **not** a Vercel app. Van already owns `canaanpreserve.com` on Cloudflare.

This cloud agent environment does **not** have a Cloudflare login or API token, so it cannot deploy. Van (or anyone with the Cloudflare account) completes the steps below once.

### 0. Prerequisites

- Node 20+
- Access to the Cloudflare account that owns `canaanpreserve.com`
- This repo cloned (`main` or this branch after merge)

```bash
npm install
npx wrangler login
```

`wrangler login` opens a browser. Approve access for the Canaan Cloudflare account.

### 1. Create D1 and R2

Either run the helper:

```bash
npm run cf:provision
```

Or create the resources by hand:

```bash
npx wrangler d1 create canaan-preserve
npx wrangler r2 bucket create canaan-preserve-uploads
```

Copy the printed `database_id` into [`wrangler.jsonc`](wrangler.jsonc) (`d1_databases[0].database_id`). Then apply the schema:

```bash
npm run db:migrate          # remote D1 (CI=1 skips the confirm prompt)
npm run db:migrate:local    # local D1 for `npm run preview`
cp .dev.vars.example .dev.vars
```

### 2. Set secrets

Required in production (the Worker will throw without them):

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

Use a long random string for `ADMIN_SESSION_SECRET` (for example `openssl rand -base64 48`).

Optional (defaults are Andrew Fuddy / `witness@canaanpreserve.com`):

```bash
npx wrangler secret put CANAAN_WITNESS_NAME
npx wrangler secret put CANAAN_WITNESS_EMAIL
```

DocuSign secrets (Manager injects these at deploy; the app only reads `process.env`):

```bash
npx wrangler secret put DOCUSIGN_INTEGRATION_KEY
npx wrangler secret put DOCUSIGN_SECRET_KEY
npx wrangler secret put DOCUSIGN_USER_ID
npx wrangler secret put DOCUSIGN_ACCOUNT_ID
npx wrangler secret put DOCUSIGN_PRIVATE_KEY
npx wrangler secret put DOCUSIGN_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
```

For `DOCUSIGN_PRIVATE_KEY`, paste the full PEM (including `BEGIN` / `END` lines), then Ctrl-D. Wrangler stores the secret; it is never written to git.

Non-secret DocuSign defaults live in `wrangler.jsonc` `vars` (`DOCUSIGN_ENABLED=false`, demo base URI and auth server). To go live after User ID + Account ID are filled in:

1. Set the secrets above.
2. Change `DOCUSIGN_ENABLED` to `true` in the Worker **Settings → Variables** (or `npx wrangler secret put DOCUSIGN_ENABLED` with value `true`).
3. Set `DOCUSIGN_RETURN_URL` to `https://canaanpreserve.com/api/docusign/return`.
4. Keep the stub path by leaving `DOCUSIGN_ENABLED` unset/false until those IDs are ready.

`STORAGE_ADAPTER=cloudflare` is already set in `wrangler.jsonc` `vars`.

### 3. Deploy the Worker

```bash
npm run deploy
```

This runs `opennextjs-cloudflare build` then `opennextjs-cloudflare deploy`. Wrangler prints a `*.workers.dev` URL when it succeeds. Confirm `/` and `/intake` load on that URL before attaching the custom domain.

### 4. Attach `canaanpreserve.com`

In the Cloudflare dashboard (same account that already owns the zone):

1. Open **Workers & Pages**.
2. Select the **canaan-preserve** Worker.
3. **Settings → Domains & Routes → Add → Custom Domain**.
4. Enter `canaanpreserve.com` and confirm.

Cloudflare creates the DNS record and certificate. If add fails because a CNAME (or other record) already exists on the apex:

1. Open **DNS → Records** for `canaanpreserve.com`.
2. Delete the conflicting apex record (often a CNAME to another host, or a leftover `100::` placeholder).
3. Retry **Add → Custom Domain**.

`www` is a different hostname. To send `www.canaanpreserve.com` to the apex:

1. Add a proxied DNS `A` record for `www` pointing to `192.0.2.0` (originless placeholder).
2. Create a Redirect Rule: `www.canaanpreserve.com` → `https://canaanpreserve.com`.

Optional later: uncomment the `routes` / `custom_domain` block in `wrangler.jsonc` so future CLI deploys keep the domain attached.

### 5. Alternative: connect GitHub (no laptop deploy)

If Van prefers dashboard deploys instead of `npm run deploy`:

1. Cloudflare dashboard → **Workers & Pages → Create → Connect to Git**.
2. Authorize GitHub and select `vanpittman12/Canaan-Ranch-Website`.
3. Production branch: `main`.
4. Build command: `npx @opennextjs/cloudflare build`
5. Deploy command: `npx @opennextjs/cloudflare deploy`
6. In **Settings → Bindings**, add:
   - D1: name `ENGAGEMENTS` → database `canaan-preserve`
   - R2: name `UPLOADS` → bucket `canaan-preserve-uploads`
7. In **Settings → Variables and Secrets**, add the same secrets as step 2, plus `STORAGE_ADAPTER=cloudflare` if it is not coming from `wrangler.jsonc`.
8. Attach `canaanpreserve.com` as in step 4.

Workers Builds also needs those values as **build** variables/secrets if the Next.js build reads them during static generation. Admin/session secrets are runtime-only.

### Local vs Cloudflare

| Command | Runtime | Storage |
| --- | --- | --- |
| `npm run dev` | Next.js / Node | File (`data/`) |
| `npm run preview` | Workerd (local) | Local D1 + R2 |
| `npm run deploy` | Cloudflare Workers | Remote D1 + R2 |

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Zod, pdf-lib, cookie-based admin session, OpenNext on Cloudflare Workers, D1, R2.
