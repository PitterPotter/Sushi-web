# Sushi-web

Website and reservation system for Kaiseki, an Edomae sushi restaurant. Built with
Next.js (App Router) and Supabase, deployed on Vercel.

| Route      | Purpose                                                        |
|------------|----------------------------------------------------------------|
| `/`        | Home                                                           |
| `/booking` | Reservations with live seat availability (12 seats, 2 seatings)|
| `/contact` | Contact form, hours, map                                       |
| `/admin`   | Staff dashboard (Supabase Auth login required)                 |

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
  lib/
    supabase.js          client + RPC helpers
    format.js            date/time helpers
supabase/schema.sql      database schema, RLS, RPC functions
```

## Setup

### 1. Database

In the Supabase dashboard open **SQL Editor → New query**, paste `supabase/schema.sql`
and run it. This creates the `reservations`, `contact_messages` and `settings` tables
(with Row Level Security) plus RPCs:

- `get_availability(date)` / `create_reservation(...)` — public, enforce capacity atomically
- `submit_contact(...)` — public
- `admin_stats()` — authenticated only

Capacity, seating times and closed weekdays live in `settings` and can be changed there.

### 2. Environment variables

```
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
**Project Settings → API**. Add the same two variables in Vercel → Project → Settings →
Environment Variables. The anon key is safe in the browser; writes go through RPCs and
tables are protected by RLS.

### 3. Admin user

**Authentication → Users → Add user** for each staff member. Any authenticated user has
full dashboard access, so disable *"Allow new users to sign up"* under
Authentication → Providers → Email.

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
