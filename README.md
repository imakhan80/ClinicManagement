# Clinic OS

A clinic operating system built with Next.js, Supabase, and shadcn/ui — connecting patient registration, appointments, the front-desk queue, triage, consultation (diagnosis/investigations/prescriptions), pharmacy dispensing, billing, and follow-ups into one workflow.

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui + Lucide icons
- Supabase: Postgres, Auth, Storage, Realtime, Row Level Security
- Zod + React Hook Form

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local` (already present in this environment) with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://yvkjfeoanzuswzeviuwa.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
3. **Apply the database schema.** The project's tables, RLS policies, triggers, and storage bucket live in `supabase/migrations/0001_init.sql` and `supabase/migrations/0002_workflow.sql`. Run both, in order, against the Supabase project via the SQL Editor in the Supabase dashboard (or `supabase db push` / the Supabase MCP server once authenticated). This has **not yet been applied** to the live project — the app will not function until it is.
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Visit `/signup` to create the first account. New accounts default to the `receptionist` role. To get an admin account, sign up once, then in the Supabase SQL editor run:
   ```sql
   update public.profiles set role = 'admin' where id = '<your auth user id>';
   ```

## Roles

`admin`, `doctor`, `nurse`, `receptionist` — enforced via Postgres Row Level Security, not just in the UI. See the migration files for the exact policies per table.

## Project structure

- `src/app/(app)/*` — authenticated app (dashboard, patients, appointments, queue, consultation, pharmacy, billing, follow-ups)
- `src/app/login`, `src/app/signup` — auth
- `src/app/page.tsx` — public marketing site
- `src/actions/*` — server actions (mutations)
- `src/lib/supabase/*` — Supabase client/server/middleware setup
- `src/lib/validations/*` — Zod schemas
- `supabase/migrations/*` — SQL schema, RLS policies, triggers, storage bucket
