# Folio

Folio is a self-hosted document editor with DOCX import/export, paged editing, and PostgreSQL autosave.

## Required environment variables

Copy `.env.example` to `.env.local` for local development. Production must configure the same values in the deployment provider; the document editor stays locked when authentication is not configured.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `FOLIO_USERNAME` | Private workspace username |
| `FOLIO_PASSWORD` | Private workspace password (minimum 12 characters) |
| `AUTH_SECRET` | Random session-signing secret (minimum 32 characters) |

Generate a strong signing secret with:

```bash
openssl rand -base64 48
```

Do not commit real credentials. In Vercel, add the variables under **Project Settings → Environment Variables** for Production and Preview, then redeploy.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`. Unauthenticated users are redirected to `/login`.

## Security model

- The editor and document/import APIs require an authenticated session.
- Credentials are read only from server-side environment variables.
- Password checks use constant-time comparisons and repeated failures are rate limited.
- Sessions are HMAC-signed, HTTP-only, SameSite=Strict cookies that expire after 12 hours.
- Logout invalidates the browser cookie, and rotating `AUTH_SECRET` invalidates every existing session.
- Security headers block framing, MIME sniffing, referrer leakage, and access to camera, microphone, and geolocation.
