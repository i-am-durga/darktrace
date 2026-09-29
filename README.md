# DarkTrace

DarkTrace is a defensive threat-intelligence and investigation platform for authorized research and analyst education. It is designed to correlate evidence and candidate relationships without treating similarity as proof of identity or wrongdoing.

## Foundation and dashboard data

The app provides a Next.js App Router shell, Supabase SSR authentication, protected workspace routes, a dashboard backed by Supabase queries, a searchable actor directory, and a Cytoscape relationship graph. Query or schema errors are shown as disconnected rather than as fabricated data.

The initial relational schema and RLS policies are in `supabase/migrations/20260927090000_initial_intelligence_schema.sql`. Search, timeline, evidence, infrastructure, investigations, analysis, alerts, reports, and settings remain navigation placeholders.

## Architecture

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Supabase Auth using `@supabase/ssr` and `@supabase/supabase-js`
- `@supabase/server` for stateless authentication in future API handlers
- Recharts for dashboard activity charts and Cytoscape.js for candidate relationship graphs
- `src/proxy.ts` refreshes sessions; the workspace layout verifies the current user server-side
- Server Actions validate authentication input with Zod
- Lucide React icons
- No separate backend is used

## Requirements

- Node.js 20.9 or later
- A Supabase project for account registration and login
- Apply the initial migration to that same Supabase project before dashboard metrics can load

## Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in. For real-world use, apply the database migration, then import only authorized records at `/ingestion`. The fictional seed is optional training data; do not run it for a real investigation.

## Environment

Copy `.env.example` to `.env.local` and add the URL and publishable key from the Supabase project settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
# Optional; server-only, and only for explicitly privileged operations.
SUPABASE_SECRET_KEY=
```

`.env*` files are ignored by Git. Never expose `SUPABASE_SECRET_KEY` to browser code or commit `.env.local`.

Set `NEXT_PUBLIC_SITE_URL` to the app's canonical origin in each deployment environment. Set the Supabase Auth site URL and allowed redirect URLs to match it, including `/reset-password`, and enable email confirmations as required by your project policy. `@supabase/server` complements rather than replaces cookie-based `@supabase/ssr`; use it for stateless API request verification. Its admin client bypasses RLS and must only be used for explicitly authorized server-side operations.

## Authentication

- `/login` signs in with Supabase Auth.
- `/register` requests an account and stores the display name in auth user metadata.
- `/forgot-password` requests an email reset link.
- `/reset-password` updates the authenticated recovery session's password.
- `/dashboard` and the workspace sections verify the user on the server and redirect unauthenticated requests to `/login`.

The profile table and role assignment are not implemented yet; they belong to the database phase. Do not treat client-supplied metadata as authorization or role information.

## Database migration

Open the Supabase Dashboard for the same project configured in `.env.local`, go to **SQL Editor → New query**, paste the complete contents of `supabase/migrations/20260927090000_initial_intelligence_schema.sql`, and run it. This creates the intelligence tables, indexes, analyst profile trigger, and RLS policies; existing auth users receive a default analyst profile. No administrator role is assigned from client metadata.

The optional `supabase/seed.sql` adds fictional training data only. It is not needed for production or real investigations. Do not run it if you want to use only your own authorized records.

## Authorized real-data ingestion

After applying the migration, sign in and open **Ingestion** in the sidebar. Upload an authorized CSV or JSON file (maximum 2 MB and 200 actor/observation records per upload). The app validates records, creates or reuses actors and sources, stores observations, calculates SHA-256 hashes, and creates linked evidence. Identical observation/source/actor/title/content combinations are skipped on repeat uploads. Supplied URLs are stored as references only; the application never fetches them.

CSV uses one observation per row with these headers:

```csv
actor_name,actor_category,actor_description,actor_status,actor_confidence,source_name,source_type,source_url,source_trust_level,title,content,observation_type,observed_at
```

Valid categories, statuses, confidence values, source types, and observation types are checked against the schema. `observed_at`, when provided, must be an ISO 8601 timestamp. Source URLs are references only and must use HTTP or HTTPS; the app never requests them. JSON accepts an object with `actors` and `observations` arrays. Each observation contains `title`, `content`, `observation_type`, optional `actor_name` and `observed_at`, and a nested `source` object with `name` and `type` (optional `url` and `trust_level`). Actor objects use the actor fields represented by the CSV columns.

Only import information you are authorized to collect and retain. Do not upload stolen credentials, private personal data, or malware. This workflow is manual file ingestion; it does not crawl forums, marketplaces, Tor, or other services.

## Confirmation email

The branded signup confirmation HTML is in [`supabase/templates/confirmation.html`](supabase/templates/confirmation.html). For the hosted Supabase project, open **Authentication → Email Templates → Confirm signup**, set the subject to `Confirm your DarkTrace account`, and replace the message body with this file's HTML. The template uses Supabase's `{{ .ConfirmationURL }}` variable, so the original confirmation flow remains intact. Repository changes do not update hosted Supabase email settings automatically; use the Dashboard preview/test before enabling it for users.

## Supabase SSR

The SSR architecture is split between `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, and `src/proxy.ts`. The Proxy refreshes Supabase cookies on requests, while the protected layout performs a server-side `getUser()` check. Route protection does not rely on the Proxy alone.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

The test script uses Node's built-in test runner; focused domain and auth tests will be added alongside their implementation phases.

## Deployment

Deploy the Next.js app to Vercel and configure the public Supabase variables plus `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_JWKS_URL` in the project environment. Apply the migration to the target Supabase project before using the dashboard. Configure matching production and preview redirect URLs in Supabase Auth. Set `SUPABASE_SECRET_KEY` only if future privileged server operations require it, and keep it server-only.

## Defensive-use boundaries

DarkTrace is for passive, authorized intelligence analysis. It does not crawl or attack Tor services, perform unauthorized scanning, steal credentials, deploy malware, or deanonymize people. Correlation results are candidate intelligence relationships and require analyst review; they do not independently establish identity, authorship, guilt, or wrongdoing.
