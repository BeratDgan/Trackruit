# Trackruit

AI-powered job application tracker. Trackruit lets you manage every stage of your job search in one place — from wishlist to offer — with a Kanban board, AI-generated cover letters, Google Calendar sync, Excel import, and a freemium plan system.

**Live:** https://trackruit.me

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Auth & DB** | Supabase (PostgreSQL + RLS + Google OAuth) |
| **AI** | OpenAI gpt-4o-mini (cover letter generation) |
| **Drag & Drop** | dnd-kit |
| **Charts** | Recharts |
| **File Parsing** | xlsx (Excel/CSV import) |
| **Container** | Docker → AWS ECR |
| **Compute** | AWS ECS Fargate |
| **Load Balancer** | AWS ALB |
| **CDN / DNS** | Cloudflare |
| **CI/CD** | GitHub Actions |

---

## Architecture

```
User
 │
 ▼
Cloudflare (CDN + DNS + TLS)
 │
 ▼
AWS ALB (Application Load Balancer)
 │
 ▼
AWS ECS Fargate (Next.js container)
 │
 ├──▶ Supabase  (Auth, PostgreSQL, RLS)
 └──▶ OpenAI API  (gpt-4o-mini)
      Google Calendar API  (calendar.events scope)
```

---

## Features

- **Kanban board** — drag-and-drop across 5 stages: Wishlist → Applied → Interview → Offered → Rejected
- **List view** — sortable table with status chips, salary, location, and date columns
- **AI Cover Letter** — generates a tailored cover letter from job URL or pasted description using gpt-4o-mini
- **Google Calendar sync** — adds interview and deadline events directly to the user's calendar (incremental OAuth)
- **Excel / CSV import** — smart column auto-detection with Turkish diacritic normalization; supports 40+ status aliases
- **Analytics dashboard** — interview rate, offer rate, avg salary expectation, weekly application chart, upcoming events widget
- **Freemium** — free plan capped at 20 applications; upgrade modal blocks further inserts gracefully
- **Dark / light theme** — persisted in `localStorage`, applied before first paint to avoid flash

---

## Local Development

### 1. Clone

```bash
git clone https://github.com/your-org/trackruit.git
cd trackruit
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` (see table below).

### 3. Install & run

```bash
npm install
npm run dev
```

App starts at http://localhost:3000.

> **Supabase setup:** Create a project at supabase.com, run the schema migrations, and enable Google OAuth under Authentication → Providers → Google. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key (gpt-4o-mini) | ✅ |

---

## CI/CD

Two GitHub Actions workflows:

| Trigger | Workflow |
|---|---|
| Push to `dev` | Lint + `next build` (fast feedback) |
| Push to `main` | Build Docker image → push to AWS ECR → deploy to ECS Fargate (rolling update) |

The ECS service pulls the new image tag and replaces tasks with zero downtime via the ALB health check.

---

## Deployment Architecture

The app runs as a stateless Next.js container on ECS Fargate behind an ALB. Cloudflare sits in front for TLS termination, caching static assets, and DDoS protection. Supabase handles all persistent state — there is no database on the compute layer. The `g_token` Google Calendar access token is stored in an httpOnly cookie (TTL 3500 s) and read server-side by the `/api/calendar/add-event` route; it is never exposed to client-side JavaScript.
