# Sushi-web

Website and reservation system for Kaiseki, an Edomae sushi restaurant. Built with
Next.js (App Router) and Supabase, deployed on Vercel.

| Route      | Purpose                                                        |
|------------|----------------------------------------------------------------|
| `/`        | Home                                                           |
| `/booking` | Reservations with live seat availability (12 seats, 2 seatings)|
| `/contact` | Contact form, hours, map                                       |
| `/admin`   | Staff dashboard (custom username/password session)             |

## Project layout

```
src/
  app/
    layout.js            root layout, fonts, metadata
    globals.css          site styles
    (site)/              public pages with Header/Footer
      page.js            home
      booking/page.js
      contact/page.js
    admin/               dashboard (own styles, no site chrome)
  components/            Header, Footer, Reveal, BookingForm, ContactForm, admin/*
  app/api/admin/         session-protected dashboard API routes
  lib/
    supabase.js          public client + reservation RPC helpers
    admin-auth.js        signed session, password verification, login limits
    admin-db.js          server-only privileged database client
    format.js            date/time helpers
scripts/admin-password-hash.mjs
supabase/schema.sql      database schema, RLS, RPC functions
supabase/migrations/     applied schema migrations
```

## Setup

### 1. Database

The full schema is in `supabase/schema.sql`; the linked project was initialized through the Supabase CLI. For a fresh project, run that file in **SQL Editor → New query**. This creates `reservations`, `contact_messages`, `settings`, and the login throttle table (all protected by Row Level Security), plus RPCs:

- `get_availability(date)` / `create_reservation(...)` — public, enforce capacity atomically
- `submit_contact(...)` — public
- `admin_stats()` — callable by the server-only service role

Capacity, seating times and closed weekdays live in `settings` and can be changed there.

### 2. Environment variables

Pull Development environment variables into a git-ignored local file after configuring them in Vercel:

```
npx vercel@latest env pull .env.development.local --environment development
```

Set these values from Supabase **Project Settings → API** and Vercel **Project → Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser-safe project credentials.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only secret used by admin API routes. Never prefix it with `NEXT_PUBLIC_`.
- `ADMIN_USERNAME` — set to `Evonne`.
- `ADMIN_PASSWORD_HASH` — generate and set as a sensitive variable (steps below).
- `ADMIN_SESSION_SECRET` — random secret used to sign eight-hour HttpOnly admin sessions.

The admin uses a custom username/password session, not Supabase Auth. Admin database requests run only on the server with the service key; RLS denies direct table access to browser users.

### 3. Configure the admin login

Set `ADMIN_USERNAME=Evonne`. To choose a new password without typing it into chat or shell history, run the hash helper and pipe it directly into Vercel:

```
npm run --silent admin:hash | npx --yes vercel@latest env add ADMIN_PASSWORD_HASH production,preview,development --sensitive --yes
```

The helper prompts twice without echoing the password and requires at least 16 characters. Generate `ADMIN_SESSION_SECRET` and add it to all Vercel environments with:

```
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))" | npx vercel@latest env add ADMIN_SESSION_SECRET production,preview,development --sensitive --yes
```

Add the Supabase service-role key as a sensitive `SUPABASE_SERVICE_ROLE_KEY` variable; never expose it with a `NEXT_PUBLIC_` name. The local pull command downloads secrets only to a git-ignored file.

The `/admin` sign-in accepts the username and password. The server stores only the scrypt password hash in environment configuration, issues an HttpOnly token backed by a hashed server-side session in `admin_sessions`, and rate-limits failures using hashed client IPs in `admin_login_attempts`. Signing out revokes the stored session.

### 4. Run

```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

Push to `main` and Vercel deploys automatically.

## Reservation flow

1. Guest picks a date → `get_availability` returns seats remaining per seating; full or
   closed seatings are disabled.
2. Guest submits → `create_reservation` re-checks capacity under a transaction lock and
   inserts with status `pending`.
3. Staff confirm, decline, seat, or mark no-show from `/admin`. Only `pending`,
   `confirmed` and `seated` bookings count toward capacity.

## Not yet included

- Email notifications to guests. Easiest route: Supabase Database Webhook on
  `reservations` → Resend/Postmark, or a Next.js Route Handler.
- Card holds / deposits.
