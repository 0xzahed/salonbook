# SalonBook — no more khata bookings

Salon/spa booking dashboard: services, staff, slot booking with
double-booking guard, statuses and revenue. Built to demo to real salons.

## Run it

```bash
npm install
cp .env.example .env   # optional — MongoDB persistence
npm run dev            # http://localhost:3000
```

Without `MONGODB_URI` data lives in `.data/` (gitignored file store —
pages and API routes may run in isolated module graphs).

## Features (built feature-by-feature)

- **F1** — services + staff models, shared file store, CRUD APIs
- **F2** — booking engine: same staff + same date + overlapping window = rejected
- **F3** — booked/done/cancelled statuses + today's schedule + monthly revenue
- **F4** — dashboard UI + one-click demo seed
- **F5** — verified build + live tests (overlap rejected, free slot booked)

## Notes

- `cacheComponents: false` + `dynamic = "force-dynamic"` so every number is live.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Mongoose (optional)
