# Sushi-web

Website and reservation system for Kaiseki, an Edomae sushi restaurant.

- `index.html` — home
- `booking.html` — reservations with live seat availability (12 seats, two seatings)
- `contact.html` — contact form, hours, map
- `admin.html` — staff dashboard (login required)

Static HTML/CSS/JS, no build step. Data and auth are handled by Supabase; hosted on Vercel.

## Setup

### 1. Database

In the Supabase dashboard open **SQL Editor → New query**, paste the contents of
`supabase/schema.sql` and run it. This creates:

- `reservations`, `contact_messages`, `settings` tables with Row Level Security
- `get_availability(date)` and `create_reservation(...)` — public RPCs that enforce the
  12-seat capacity per seating atomically
- `submit_contact(...)` — public RPC for the contact form
- `admin_stats()` — dashboard numbers (authenticated only)

Capacity, seating times and closed weekdays live in the `settings` table and can be
edited there without touching code.

### 2. Credentials

Copy the **Project URL** and **anon public** key from **Project Settings → API** into
`js/config.js`. The anon key is safe to ship to browsers; all writes go through the RPCs
and the tables are protected by RLS.

### 3. Admin user

**Authentication → Users → Add user**. Create an email/password user for each staff
member. Any authenticated user has full access to the dashboard, so only create accounts
for staff. Under **Authentication → Providers → Email**, you may want to turn off
*"Allow new users to sign up"* so nobody can self-register.

### 4. Deploy

Push to `main`; Vercel deploys automatically. Locally:

```
python3 -m http.server 8080
```

Then open <http://localhost:8080> and <http://localhost:8080/admin.html>.

## Reservation flow

1. Guest picks a date → `get_availability` returns seats remaining per seating; full or
   closed seatings are disabled in the dropdown.
2. Guest submits → `create_reservation` re-checks capacity inside a transaction lock and
   inserts with status `pending`.
3. Staff confirm, decline, seat, or mark no-show from `admin.html`. Only `pending`,
   `confirmed` and `seated` bookings count toward capacity.

## Not yet included

- Email notifications to guests (confirm/decline). Easiest route: a Supabase Database
  Webhook on `reservations` → Resend/Postmark, or an Edge Function.
- Card holds / deposits.
