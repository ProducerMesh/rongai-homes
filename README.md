# Rongai Homes — Phase 1

Real-time property discovery platform for Ongata Rongai. Working brand name;
change it freely later — nothing in the code depends on it.

## What's in Phase 1

- Next.js 14 (App Router) + TypeScript + Tailwind, with a design system
  (colors, type, the "pulse" availability signature) in `tailwind.config.ts`
  and `src/app/globals.css`
- Full Prisma schema covering users/roles, landlords/agents/caretakers,
  neighbourhoods, properties, buildings & units, amenities, availability &
  verification records, viewing requests, saved properties, alerts,
  notifications, reports, reviews, audit logs, and featured listings
  (`prisma/schema.prisma`)
- NextAuth: Google sign-in + a phone/OTP-shaped credentials provider you can
  wire to a real SMS provider later (`src/lib/auth.ts`)
- Homepage: hero, intent search (rent/buy/land/commercial), neighbourhood
  browser, "Available now" live listings, how-it-works, list-your-property CTA

## Getting a database running (you don't need Docker)

The easiest path for one person building this alone is **Supabase** — free
hosted Postgres, ready in about five minutes, no local installs:

1. Go to supabase.com → New project. Pick a name and a database password
   (save the password somewhere).
2. Once it's provisioned: **Project Settings → Database → Connection string
   → URI**. Copy it.
3. Paste it into `.env` as `DATABASE_URL` (copy `.env.example` to `.env` first).
4. Run:
   ```bash
   npm install
   npm run db:push     # creates all the tables from prisma/schema.prisma
   npm run db:seed      # loads the 9 Ongata Rongai neighbourhoods + amenities
   npm run dev
   ```
5. Open http://localhost:3000.

You can inspect/edit data visually anytime with `npm run db:studio`.

If you later outgrow Supabase's free tier or want it self-hosted, the schema
is plain Postgres — no code changes needed, just swap `DATABASE_URL`.

## Auth setup

- **Google sign-in**: create OAuth credentials at
  console.cloud.google.com → APIs & Services → Credentials → OAuth client ID
  (type: Web application). Add `http://localhost:3000/api/auth/callback/google`
  as an authorized redirect URI. Put the client ID/secret in `.env`.
- **Phone sign-in**: the `phone-otp` provider in `src/lib/auth.ts` is stubbed
  to find-or-create a user by phone number. Before this goes live, wire its
  `authorize()` to a real OTP send/verify step (Africa's Talking or Twilio
  Verify both work well for Kenyan numbers) — the rest of the app doesn't
  need to change.
- Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

## What's next (Phase 2)

Property creation, image upload, search/filtering, map view, and listing
cards — continuing directly from this structure, no restart.
