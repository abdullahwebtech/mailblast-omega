# MailBlast OMEGA — Complete System Architecture & AI Agent Guide

> **IMPORTANT**: This document is the **Single Source of Truth** for the MailBlast OMEGA platform. It is designed to be provided to an AI coding agent as the primary context for building new features. It covers the architecture, authentication, data isolation, and core engine logic to ensure zero-breakage development.

---

## 1. System Overview

**MailBlast OMEGA** is a high-performance, multi-tenant SaaS platform for enterprise-grade cold email outreach. It is built as a split-architecture system:

*   **Frontend**: Next.js 14 (App Router) — A premium, light-themed dashboard with real-time updates.
*   **Backend**: Python FastAPI — A high-concurrency engine handling parallel SMTP dispatch, AI generation, and tracking.
*   **Infrastructure**: Supabase (Authentication & OAuth) + SQLite (Localized persistent data storage).

### Key Value Propositions
1.  **Blazing Speed**: Parallel dispatch with SMTP connection pooling (capped at 8 threads).
2.  **Ironclad Isolation**: Strict multi-tenant data separation via `user_id` filtering at the database layer.
3.  **Elite Tracking**: 5-layer open tracking to eliminate false positives (ISP scans, sender previews, bot bursts).
4.  **AI Power**: Integrated LLaMA 3.3 70B for dynamic email personalization.

---

## 2. Technical Stack

### Frontend (`mailblast-web/`)
| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14.2.35 (App Router / Client-side rendering) |
| **Authentication** | Supabase Auth (@supabase/ssr) — Email/Pass + Google OAuth |
| **State Management** | React Context (`AuthContext`, `ModalContext`) |
| **Styling** | Vanilla CSS + TailwindCSS 3.4 |
| **Animations** | Framer Motion 12 (Premium micro-interactions) |
| **Charts** | Recharts 3.8 |
| **Editor** | TipTap (Rich Text) with Custom Hex Color Picker |
| **Icons** | Lucide React |

### Backend (`mailblast-omega/`)
| Layer | Technology |
| :--- | :--- |
| **API Framework** | FastAPI (ASGI) |
| **Server** | Uvicorn (Watch mode enabled) |
| **Database** | SQLite 3 (WAL Mode) — Permanent storage at `database/omega.db` |
| **Dispatch** | `smtplib` + `threading` (ThreadPoolExecutor) |
| **Queue** | Custom Sequential Queue Worker (SQLite-driven) |
| **AI Engine** | Groq SDK (LLaMA 3.3 70B) |
| **Scheduling** | APScheduler (Background Task Runner) |
| **Security** | Fernet (AES-256) for SMTP/IMAP credentials |
| **Middleware** | Custom header-based `user_id` injection |

---

## 3. Directory Structure

```text
/Users/user/Desktop/MailBlast Pro Light Theme kiro/
├── mailblast-web/             # ── NEXT.JS FRONTEND ──
│   ├── src/app/               # All dashboard pages (dashboard, composer, analytics, etc.)
│   ├── src/components/        # Shared UI components (CampaignEditor, RichTextEditor)
│   ├── src/context/           # AuthContext (Supabase) + ModalContext
│   ├── src/lib/               # Supabase client init
│   └── .env.local             # Supabase URL & Anon Key
│
├── mailblast-omega/           # ── PYTHON BACKEND ──
│   ├── api_bridge.py          # Main FastAPI entry point (The "Brain")
│   ├── data/db.py             # Database Layer (Schema & Queries with Isolation)
│   ├── core/                  # Engine logic (sender, scheduler, ai_generator, warmup)
│   ├── database/              # SQLite persistent store (omega.db)
│   ├── tracking/              # Tracking pixel logic (injection & server)
│   ├── credentials/           # OAuth token cache
│   └── requirements.txt       # Dependencies
│
├── .env.local                 # Master environment variables (shared)
└── SYSTEM_DOCUMENTATION.md    # This guide
```

---

## 4. Authentication & Security (SaaS Mode)

The system is now a **Multi-Tenant SaaS**.

### Authentication Flow
1.  **Signup/Login**: Handled via `AuthContext.tsx` using Supabase.
2.  **Email Verification**: Required. `AuthGuard.tsx` prevents dashboard access until the user confirms their email.
3.  **Google OAuth**: Fully configured. Redirects to `/auth` which then routes to `/dashboard`.
4.  **Session Persistence**: Supabase handles local session storage. Logout clears all local states.

### Feature: Automated Email Discovery
The system scans `data/seeds.txt` and automatically assigns specific targets to testing nodes without hitting primary data sheets.

### Feature: Soft-Delete & Trash System
To prevent accidental data loss and maintain historical analytics integrity, the platform utilizes a unified Soft-Delete mechanism:
1.  **Architecture**: `deleted_at` fields in `accounts`, `campaigns`, `send_log`, and `templates`.
2.  **Logic**: Primary metrics and history filter out deleted items (`WHERE deleted_at IS NULL`). However, deleted `send_log` entries **do not** affect the aggregate `sent` or `opened` counters on their parent campaign, preserving data accuracy.
3.  **Frontend Module**: A centralized `/trash` UI provides structured, categorized tabs for Campaigns, Sent Emails, Accounts, and Templates, allowing for **Restore** or **Hard Delete**.
4.  **Auto-Cleanup Daemon**: An `asyncio` background task running in the FastAPI lifecycle permanently removes soft-deleted items older than 7 days from the filesystem every 24 hours.

### Data Isolation (CRITICAL)
Every request from the frontend automatically carries a `X-User-Id` header.
- **Frontend Interceptor**: Located in `AuthContext.tsx`. It wraps `window.fetch` to inject the Supabase `user.id` into every call to `localhost:8000`.
- **Backend Middleware**: Located in `api_bridge.py`. It extracts `X-User-Id` and stores it in a `contextvars.ContextVar`.
- **Database Layer**: Located in `data/db.py`. **Every query** for campaigns, accounts, stats, and logs uses `current_user_id.get()` to filter rows.
  - *New users see a 100% empty dashboard.*
  - *Existing users see ONLY their own data.*

---

## 5. Core Engine Details

### 5.1 The Sequential Queue Worker
The engine does not send emails instantly.
1.  **Queue Insertion**: Campaigns/Single sends are inserted into `send_log` with status `queued`.
2.  **Worker Loop**: A background thread (`queue_worker`) polls the DB for `queued` or `retrying` items.
3.  **Parallel Execution**: It uses a `ThreadPoolExecutor` (max 8) to process rows in parallel.
4.  **Account Staggering**: Each SMTP account is staggered by 0.1s - 0.5s to prevent provider-side blocking.

### 5.2 Elite Tracking & Analytics
To stop "Ghost Opens" (opens triggered by bots/ISPs):
1.  **IP Fingerprinting**: Registers sender's IP/UA; hits from these are ignored.
2.  **Activation Cooldown**: 60-second "Sender Silent Period" where tracking is ignored.
3.  **Proxy Detection**: Specifically filters Google/Microsoft image proxies.
4.  **Tracking Status**: Sent Logs now display real-time **Opened** vs **Pending** status.
5.  **Multi-Account Analytics**: The Analytics tab supports granular filtering by **Email Account**, allowing performance breakdowns per sender. Dashboard overview remains a global aggregate.
6.  **Server-Side Filtering**: Supports granular filtering by **Account** and **Open Status** (All/Opened/Pending) in logs.

### 5.3 SMTP/IMAP Sync
When an email is sent:
1.  The SMTP server sends the mail.
2.  An `IMAP_Shadow_Sync` thread logs into the sender's IMAP server and **manually appends** the email to the "Sent" folder.
3.  This ensures the user's external inbox (Gmail/Outlook) matches the MailBlast dashboard perfectly.

---

## 6. Database Schema (SQLite)

The system uses 11 main tables in `database/omega.db`.

| Table | Purpose | Multi-Tenant? |
| :--- | :--- | :--- |
| `accounts` | SMTP/IMAP Credentials (AES Encrypted) | ✅ `user_id` |
| `campaigns` | Campaign metadata and settings | ✅ `user_id` |
| `send_log` | Unified logs for every email sent/failed | ✅ (Filtered via `account_id`) |
| `tracking_events` | Individual "Open" and "Click" events | Inherited |
| `templates` | Email copy templates | ✅ (Frontend isolated) |
| `blacklist` | Suppressed email addresses | Inherited |
| `warmup_log` | Daily stats for the Warmup Engine | ✅ (Filtered via `account_id`) |
| `scheduled_jobs` | Future-dated dispatch tasks | Inherited |

---

## 7. Development Guidelines for AI Agents

When building new features, follow these **Golden Rules**:

### Rule 1: Never Bypass the `user_id` Filter
- When adding a new SQL query in `db.py`, always retrieve `uid = current_user_id.get()` and add `WHERE user_id = ?` to the query.
- Failure to do this will cause a major security leak where one user can see another's data.

### Rule 2: Respect the Queue Worker
- Do not trigger SMTP sends directly in an API route. 
- Instead, insert a row into `send_log` with status `queued` and let the background worker handle it.

### Rule 3: Use Absolute DB Paths
- The database is initialized with an absolute path in `db.py`. DO NOT change it to a relative path, or the system will create multiple empty databases depending on where the server is launched.

### Rule 4: Frontend Aesthetics
- The design system is "Premium Light Mode". Use `#1297FD` (MailBlast Blue) for primary actions. 
- Use Framer Motion for all new UI elements (`initial={{ opacity: 0 }} animate={{ opacity: 1 }}`).

---

## 8. Setup & Running

1.  **Backend**:
    ```bash
    cd mailblast-omega
    source venv/bin/activate
    python api_bridge.py
    ```
    *Runs on port 8000.*

2.  **Frontend**:
    ```bash
    cd mailblast-web
    npm run dev
    ```
    *Runs on port 3000.*

3.  **Supabase**: Ensure `.env.local` inside `mailblast-web` has the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 10. API Quick Reference

- `GET /api/analytics/stats`: Dashboard aggregate stats. Supports `account_id` filter (optional).
- `GET /api/analytics/open-rate-history`: Historical trend data. Supports `account_id` filter (optional).
- `GET /api/analytics/send-log`: Full unified history. Supports `account_id` and `tracking_status` (all|opened|pending) filters.
- `WS /ws/live-log`: Real-time dispatch stream.

---

## 11. Implemented Features, Modules & Applied Fixes

### Templates Module
- **Behavior**: Permits authenticated users to generate reusable, multi-tenant separated email architectural structures (requiring `name`, `subject`, and `body_plain`). 
- **Functionality**: Reusable content blueprints. Utilizing "Use Template" seamlessly teleports the chosen structure directly to the active Composer state via `localStorage`.
- **Applied Fixes**: Engineered a targeted `ALTER TABLE` SQL migration layer inside `data/db.py`'s `_init_db` function to inject a missing `user_id TEXT` column to the `templates` object. This successfully restored broken Template creation workflows safely, ensuring the platform remains thoroughly locked down under strict Multi-Tenant regulations with zero systemic regressions.

### Essential Platform Addbacks & Engine Revisions
- **Sent Logs & Dispatch Monitor Patch**: Salvaged `get_send_log` endpoint connections inside `db.py` mapping to globally restore UI-level visibility of real-time server events (`send_log`) without interrupting the parallel SMTP thread pool logic or active running campaigns.
- **Data Protection & Vault**: Deployed non-destructive Trash integration ensuring user-orchestrated deletes strictly tag items (`deleted_at`) rather than hard-dropping, maintaining the mathematical integrity of historical Campaign charts and Open Rate percentages. Auto-daemon permanently clears older elements autonomously.

---
**End of Documentation**. Use this context to build a better MailBlast OMEGA.
