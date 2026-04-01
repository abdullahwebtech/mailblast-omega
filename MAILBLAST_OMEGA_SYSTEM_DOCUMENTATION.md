# MailBlast OMEGA — Complete System Documentation

> **Purpose**: This document is the single-source-of-truth reference for the MailBlast OMEGA email automation platform. It is designed to be given to an AI coding agent as context so it can work on new features WITHOUT breaking existing functionality.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [How to Run the System](#4-how-to-run-the-system)
5. [Backend: `mailblast-omega/`](#5-backend-mailblast-omega)
   - [5.1 API Bridge (FastAPI)](#51-api-bridge-fastapi)
   - [5.2 Database Layer](#52-database-layer)
   - [5.3 Email Dispatch Engine](#53-email-dispatch-engine)
   - [5.4 Tracking System](#54-tracking-system)
   - [5.5 AI Generation](#55-ai-generation)
   - [5.6 Scheduler Engine](#56-scheduler-engine)
   - [5.7 Warm-Up Engine](#57-warm-up-engine)
   - [5.8 Credential Vault](#58-credential-vault)
   - [5.9 Template & Variable Engine](#59-template--variable-engine)
   - [5.10 Other Core Modules](#510-other-core-modules)
6. [Frontend: `mailblast-web/`](#6-frontend-mailblast-web)
   - [6.1 Tech Stack & Design System](#61-tech-stack--design-system)
   - [6.2 All Pages](#62-all-pages)
   - [6.3 Shared Components](#63-shared-components)
7. [Complete API Reference](#7-complete-api-reference)
8. [Database Schema (All 11 Tables)](#8-database-schema-all-11-tables)
9. [WebSocket Protocol](#9-websocket-protocol)
10. [Environment Variables](#10-environment-variables)
11. [Key Behavioral Rules & Gotchas](#11-key-behavioral-rules--gotchas)
12. [Feature Status Matrix](#12-feature-status-matrix)

---

## 1. System Overview

**MailBlast OMEGA** is a private-build, enterprise-grade email automation platform with:

- **High-concurrency email dispatch** with SMTP connection pooling and 8-thread parallel dispatch
- **Real-time campaign monitoring** via WebSocket live-log
- **5-layer open-tracking** with false-positive elimination (sender fingerprinting, ISP scan blocking, proxy detection, burst protection, cooldown timers)
- **AI-powered email generation** using Groq's LLaMA 3.3 70B (free tier)
- **Campaign scheduling** with APScheduler (timezone-aware)
- **Inbox warm-up engine** with 25-day progressive schedule
- **Dynamic variable substitution** and spintax support
- **Per-row dynamic file attachments** from uploaded folders
- **Rich text editor** (TipTap) with hex color picker, links, alignment
- **AES-256 Fernet encryption** for all stored passwords
- **IMAP shadow sync** (appends sent emails to Sent folder in background)
- **Bounce detection & automatic blacklisting**
- **Campaign controls**: Pause, Resume, Cancel (live, mid-campaign)
- **Retry engine**: 3-attempt exponential backoff (5s, 10s, 20s)

The system consists of **two independently running processes**:

| Process | Technology | Port | Role |
|---------|-----------|------|------|
| **Backend API** | Python FastAPI + Uvicorn | `8000` | All business logic, email dispatch, tracking, AI, DB |
| **Frontend Web** | Next.js 14 (React 18) | `3000` | Dashboard UI, Composer, Analytics, all user-facing pages |

They communicate via REST API calls (`http://localhost:8000/api/...`) and a WebSocket (`ws://localhost:8000/ws/live-log`).

---

## 2. Architecture & Tech Stack

### Backend (Python)
| Component | Technology |
|-----------|-----------|
| Web Framework | FastAPI 0.110+ |
| Server | Uvicorn |
| Database | SQLite 3 (WAL mode) at `database/omega.db` |
| Email Sending | Python `smtplib` (direct SMTP) |
| IMAP Sync | Python `imaplib` |
| AI Engine | Groq SDK → LLaMA 3.3 70B |
| Scheduler | APScheduler 3.10+ (BackgroundScheduler) |
| Encryption | `cryptography.fernet` (AES-256) |
| Tracking Server | Flask 3.0 (legacy, runs on port 5500 for desktop app) |
| Tracking (API) | FastAPI endpoint at `/api/t/o/{id}.gif` |
| Exports | ReportLab (PDF), openpyxl (Excel) |
| Env Management | python-dotenv |

### Frontend (TypeScript/React)
| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14.2.35 (App Router) |
| Language | TypeScript 5 |
| Styling | TailwindCSS 3.4 |
| Animations | Framer Motion 12 |
| Charts | Recharts 3.8 |
| Rich Text Editor | TipTap 3.21 (StarterKit + 10 extensions) |
| Icons | Lucide React |
| Spreadsheet Parsing | SheetJS (xlsx) |
| Smooth Scroll | @studio-freight/react-lenis |
| Fonts | Bricolage Grotesque, Instrument Sans, Fira Code, Inter, JetBrains Mono |

---

## 3. Directory Structure

```
/Users/user/Desktop/MailBlast Pro Light Theme kiro/
├── mailblast-omega/                  # ── PYTHON BACKEND ──
│   ├── api_bridge.py                 # FastAPI server (1282 lines) — THE MAIN ENTRY POINT
│   ├── app.py                        # Desktop GUI (CustomTkinter) — Legacy, not used in web mode
│   ├── main.py                       # CLI launcher (legacy)
│   ├── .env                          # Environment variables (API keys, encryption key, tracking domain)
│   ├── requirements.txt              # Python dependencies
│   ├── seeds.txt                     # Warm-up seed email addresses
│   ├── test_send.py                  # Quick test send script
│   │
│   ├── core/                         # ── Business Logic Modules ──
│   │   ├── __init__.py
│   │   ├── ai_generator.py           # Groq LLaMA 3.3 AI email/subject generation
│   │   ├── bounce_handler.py         # IMAP bounce scanner → auto-blacklist
│   │   ├── credential_vault.py       # Fernet AES-256 password encryption/decryption
│   │   ├── gmail_client.py           # Gmail OAuth2 client (Google API)
│   │   ├── imap_client.py            # Generic SMTP client + Yahoo client
│   │   ├── outlook_client.py         # Outlook/MSAL OAuth client
│   │   ├── rotation_manager.py       # Round-robin / random account rotation
│   │   ├── scheduler_engine.py       # APScheduler integration + timezone detection
│   │   ├── sender.py                 # OmegaSender class (legacy batch sender)
│   │   ├── template_engine.py        # {Variable} substitution + {spintax|support}
│   │   ├── variable_manager.py       # System + custom variable definitions
│   │   └── warmup_engine.py          # 25-day progressive warm-up schedule
│   │
│   ├── data/                         # ── Data Access Layer ──
│   │   ├── __init__.py
│   │   ├── db.py                     # Database class (615 lines) — ALL queries + schema
│   │   └── loader.py                 # Legacy data loader
│   │
│   ├── database/                     # ── SQLite Database Files ──
│   │   └── omega.db                  # Main production database (WAL mode)
│   │
│   ├── tracking/                     # ── Open/Click Tracking ──
│   │   ├── __init__.py
│   │   ├── pixel.py                  # Tracking pixel injection + click URL rewriting
│   │   └── server.py                 # Flask tracking server (port 5500, legacy)
│   │
│   ├── utils/                        # ── Utilities ──
│   │   ├── __init__.py
│   │   ├── export_engine.py          # PDF + Excel campaign report exports
│   │   └── timezone_utils.py         # TLD → timezone detection
│   │
│   ├── uploads/                      # ── Runtime Upload Storage ──
│   │   └── attachments/              # Per-batch attachment folders (UUID-named)
│   │
│   ├── credentials/                  # ── OAuth Token Storage ──
│   │   └── tokens/                   # Gmail/Outlook OAuth token files
│   │
│   ├── ui/                           # ── Desktop GUI Views (Legacy) ──
│   │   ├── dashboard.py, composer.py, ai_studio.py, accounts.py, settings.py
│   │   └── widgets/
│   │
│   ├── templates/                    # HTML email templates
│   │   └── index.html
│   │
│   ├── scripts/
│   │   └── migrate_db.py             # Database migration helper
│   │
│   ├── exports/                      # Generated PDF/Excel exports
│   └── assets/                       # Static assets
│
├── mailblast-web/                    # ── NEXT.JS FRONTEND ──
│   ├── package.json                  # Dependencies & scripts
│   ├── next.config.mjs               # Next.js config
│   ├── tailwind.config.ts            # Tailwind configuration
│   ├── tsconfig.json                 # TypeScript config
│   ├── parse_html.js                 # HTML parser utility
│   │
│   └── src/
│       ├── app/                      # ── Next.js App Router Pages ──
│       │   ├── layout.tsx            # Root layout (fonts, ModalProvider, AppLayoutWrapper)
│       │   ├── globals.css           # Global styles
│       │   ├── page.tsx              # Landing page (67KB, full marketing page)
│       │   ├── dashboard/page.tsx    # Analytics dashboard
│       │   ├── composer/page.tsx     # Campaign composer + live progress
│       │   ├── campaigns/page.tsx    # All campaigns list
│       │   ├── campaigns/[id]/page.tsx # Individual campaign detail
│       │   ├── scheduler/page.tsx    # Schedule dispatch + job list
│       │   ├── ai-studio/page.tsx    # AI email generation (Templates + Custom Prompt)
│       │   ├── analytics/page.tsx    # Detailed analytics charts
│       │   ├── sent/page.tsx         # Unified send log (with detail modal + live WS updates)
│       │   ├── warmup/page.tsx       # Inbox warm-up control panel
│       │   ├── accounts/page.tsx     # Email account management (CRUD)
│       │   ├── templates/page.tsx    # Email templates
│       │   ├── blacklist/page.tsx    # Suppression list
│       │   └── settings/page.tsx     # API keys, seed list, DB config
│       │
│       ├── components/               # ── Shared React Components ──
│       │   ├── CampaignEditor.tsx    # The main campaign editor (shared by Composer & Scheduler)
│       │   ├── Editor/
│       │   │   ├── RichTextEditor.tsx # TipTap WYSIWYG editor
│       │   │   └── Toolbar.tsx       # Editor formatting toolbar
│       │   ├── charts/
│       │   │   └── OpenRateChart.tsx  # Recharts chart component
│       │   ├── layout/
│       │   │   ├── AppLayoutWrapper.tsx # Conditional sidebar (landing vs dashboard)
│       │   │   ├── Sidebar.tsx       # Navigation sidebar (12 links, collapsible, responsive)
│       │   │   └── SmoothScroll.tsx  # Lenis smooth scroll wrapper
│       │   └── ui/
│       │       ├── StatCard.tsx      # Reusable stat card component
│       │       └── TerminalLog.tsx   # Terminal-style log display
│       │
│       └── context/
│           └── ModalContext.tsx       # Global modal system (alert, confirm, prompt)
│
└── *.md files                        # Various documentation files (legacy)
```

---

## 4. How to Run the System

### Backend (Terminal 1)
```bash
cd mailblast-omega
python api_bridge.py
# Starts FastAPI on http://localhost:8000
# Auto-starts the SequentialQueueWorker on startup
# Auto-starts the SchedulerEngine (reloads pending jobs)
```

### Frontend (Terminal 2)
```bash
cd mailblast-web
npm run dev
# Starts Next.js on http://localhost:3000
```

### Environment Prerequisites
- Python 3.10+ with venv
- Node.js 18+ with npm
- All Python deps installed: `pip install -r requirements.txt`
- All Node deps installed: `npm install`
- `.env` file must exist in `mailblast-omega/` with `ENCRYPTION_KEY` set

---

## 5. Backend: `mailblast-omega/`

### 5.1 API Bridge (FastAPI)

**File**: `api_bridge.py` (1282 lines) — This is THE main backend file.

**Startup sequence** (`@app.on_event("startup")`):
1. Captures the asyncio event loop (`main_loop`)
2. Starts the `SequentialQueueWorker` background thread
3. The `SchedulerEngine` initializes on import and reloads pending scheduled jobs

**Key middleware**:
- CORS: Allow all origins (`*`)
- IP Registration: Every non-tracking request registers the client's IP + User-Agent in `internal_ips` table (used for sender fingerprinting in tracking)

**Key classes defined in `api_bridge.py`**:

| Class | Purpose |
|-------|---------|
| `SMTPConnectionPool` | Thread-safe SMTP connection pool using `LifoQueue`. Max 8 connections per account. |
| `SequentialQueueWorker` | Background daemon thread. Polls `send_log` for `queued`/`retrying` items. Uses `ThreadPoolExecutor(max_workers=8)`. |
| `CampaignLaunchRequest` | Pydantic model for campaign launch payload |
| `TestSendRequest` | Pydantic model for single test sends |
| `SingleEmailScheduleRequest` | Pydantic model for scheduling single emails |
| `AccountRequest` | Pydantic model for adding accounts |
| `EditAccountRequest` | Pydantic model for editing accounts |
| `GenerateRequest` | Pydantic model for AI generation requests |
| `WarmupSender` | Wrapper class to send warm-up emails via `execute_node_dispatch` |

**Key functions**:

| Function | Purpose |
|----------|---------|
| `execute_node_dispatch()` | GOD MODE dispatch: SMTP send with 3-attempt retry engine (30s/60s/90s timeouts). Fires background IMAP sync thread. |
| `_build_email_message()` | Constructs `EmailMessage` with HTML/plain multipart, tracking pixel, attachments |
| `background_imap_sync()` | Shadow worker: appends sent email to IMAP Sent folder (fire-and-forget) |
| `process_campaign_bulk()` | Fills `send_log` with `queued` records for the queue worker to pick up |
| `sync_broadcast()` | Thread-safe bridge to push events from sync threads to async WebSocket clients |
| `run_campaign_async()` | Bridge for APScheduler to run scheduled campaigns |

### 5.2 Database Layer

**File**: `data/db.py` (615 lines)

**Class**: `Database` — Singleton via `get_db()`

**Connection settings**:
- Path: `database/omega.db`
- Timeout: 20 seconds
- Journal mode: WAL (Write-Ahead Logging) for concurrent read/write
- Row factory: `sqlite3.Row` (dict-like access)

**Auto-migrations** in `_init_db()`:
- Adds `retry_count` to `send_log` if missing
- Adds `next_retry_at` to `send_log` if missing
- Adds `delay_seconds` to `campaigns` if missing

**Global convenience functions** (module-level, used throughout):
`get_db()`, `get_all_campaigns()`, `get_campaign()`, `create_campaign()`, `update_campaign_progress()`, `get_global_stats()`, `get_dispatch_history()`, `get_recent_campaigns()`, `get_send_log()`, `get_all_accounts()`, `add_account()`, `log_send()`, `mark_opened()`

### 5.3 Email Dispatch Engine

The dispatch engine is the heart of the system. Here's how it works:

#### Campaign Launch Flow
1. Frontend calls `POST /api/campaign/launch` with `CampaignLaunchRequest`
2. `api_launch_campaign()` creates the campaign record in DB
3. Calls `process_campaign_bulk()` in a background task
4. `process_campaign_bulk()` expands email data rows, validates emails, inserts into `send_log` with status `queued`
5. Sets campaign status to `running`

#### Queue Worker Flow (Background Thread)
The `SequentialQueueWorker._worker_loop()` runs forever:
1. Finds all campaigns with `status = 'running'`
2. For each campaign, fetches up to 100 `queued` or `retrying` items
3. Locks them to `processing` status
4. For each item, submits `_dispatch_single()` to the `ThreadPoolExecutor`
5. Sleeps for `delay_seconds` between each dispatch (configurable, default 0.1s)
6. Checks campaign status between dispatches (supports mid-campaign pause/cancel)
7. When no more items exist and none are pending, marks campaign `completed`

#### Single Dispatch Flow (`_dispatch_single()`)
1. Loads account credentials from DB
2. Validates recipient email format
3. Substitutes `{variables}` in subject and body from `row_data`
4. Resolves per-row attachment path if applicable
5. Builds the email message via `_build_email_message()`
6. Attempts SMTP send via `SMTPConnectionPool` (2 attempts)
7. Falls back to `execute_node_dispatch()` if pool fails
8. On success: marks `sent` in DB, broadcasts via WebSocket
9. Fires background IMAP sync thread
10. On failure: implements exponential backoff retry (3 attempts, 5s/10s/20s)

#### SMTP Connection Pool
- Uses `queue.LifoQueue` per account (max 8 connections)
- Connections are tested with `NOOP` before reuse
- Dead connections are replaced automatically
- All connections cleaned up when a campaign completes

#### Email Message Construction (`_build_email_message()`)
- Multipart: plain text + HTML alternative
- Auto-detects HTML content via regex
- Injects 1x1 tracking pixel GIF before `</body>`
- Supports file attachments with MIME type detection
- Sets proper headers: `From` (with display name), `Reply-To`, `Date`, `Message-ID`

### 5.4 Tracking System

#### Open Tracking
**Endpoint**: `GET /api/t/o/{tracking_id}.gif`

When an email is opened, the tracking pixel is loaded. The system applies a **5-layer validation** to filter out false positives:

| Layer | Name | Logic |
|-------|------|-------|
| 1.1 | ISP Scan Block | Ignores opens within 20 seconds of send time |
| 1.2 | Activation Cooldown | Ignores opens within 60 seconds of send time |
| 2 | Sender Fingerprint | Rejects if IP + User-Agent matches a known sender session (from `internal_ips` table) |
| 3 | Proxy/Bot Detection | Google Proxy detection (66.249.x, 72.14.x, etc.), Microsoft Proxy detection (40.x, 52.x). Cross-references proxy origin with recipient domain. |
| 4 | Burst Protection | If the same IP prefix has hit ≥2 distinct tracking IDs for the same campaign in 2 minutes, it's a sender scrolling Sent folder → ignored |
| 5 | Duplicate Guard | Only increments campaign-level `opened` counter on the first open per recipient. Subsequent opens only increment `open_count`. |

Returns a 1x1 transparent GIF with aggressive no-cache headers.

#### Click Tracking
**Flask server** (port 5500): `GET /c/{tracking_id}?url=<destination>`
- Records click event in `tracking_events` table
- Redirects to destination URL

#### Unsubscribe
**Flask server**: `GET /unsub/{tracking_id}`
- Adds recipient to `blacklist` table with reason `unsubscribed`

#### Tracking Pixel Injection (`tracking/pixel.py`)
- `inject_tracking_pixel()`: Inserts 1x1 GIF before `</body>` tag
- `inject_click_tracking()`: Rewrites all `href` attributes to pass through click tracker (except unsubscribe links)
- `generate_tracking_id()`: UUID without dashes
- `get_unsub_link()`: Returns unsubscribe URL

### 5.5 AI Generation

**File**: `core/ai_generator.py`

**Engine**: Groq SDK → model `llama-3.3-70b-versatile`

**Two modes**:

1. **Templates Mode**: Takes `product`, `audience`, `tone` → generates cold email with `{FirstName}`, `{Company}`, `{Website}` variables. Output is HTML-formatted.

2. **Custom Prompt Mode**: Takes free-form instructions. System prompt enforces strict output (no conversational filler, just the requested content in HTML format).

**Endpoints**:
- `POST /api/ai/generate` — Generate email(s) from brief
- `POST /api/ai/rewrite` — Rewrite existing draft with instruction
- `POST /api/ai/subjects` — Generate N subject lines from context

**Output format**: Always JSON `{"subject": "...", "body": "..."}`

**Error handling**: If `GROQ_API_KEY` is empty, returns a specific error message guiding the user to the Settings page.

### 5.6 Scheduler Engine

**File**: `core/scheduler_engine.py`

**Technology**: APScheduler `BackgroundScheduler` with UTC timezone.

**Startup**: Reloads all `pending` scheduled jobs from `scheduled_jobs` table. Jobs in the past are marked `missed`.

**Features**:
- Schedule bulk campaigns for a future datetime
- Schedule single emails
- List pending jobs
- Cancel pending jobs
- TLD-based timezone detection (maps `.pk` → Asia/Karachi, `.com` → America/New_York, etc.)
- `schedule_for_9am()`: Calculates UTC time for 9 AM in recipient's detected timezone

**Database table**: `scheduled_jobs` — tracks job lifecycle: `pending` → `running` → `done` / `failed` / `cancelled`

### 5.7 Warm-Up Engine

**File**: `core/warmup_engine.py`

**Purpose**: Gradually builds domain/IP reputation by sending warm-up emails to seed addresses.

**25-day progressive schedule**:
| Day | Emails | Day | Emails |
|-----|--------|-----|--------|
| 1 | 5 | 14 | 260 |
| 5 | 25 | 20 | 635 |
| 10 | 110 | 25+ | 1000 (max) |

**Pacing**: Random 30-120 second delay between each warm-up send.

**Seed list**: Loaded from `seeds.txt` file. Configurable in Settings UI.

**Control**: Start/Stop per account via `POST /api/warmup/toggle/{account_id}`.

### 5.8 Credential Vault

**File**: `core/credential_vault.py`

**Encryption**: Fernet (AES-256-CBC) symmetric encryption.

**Key management**:
- Key stored in `.env` as `ENCRYPTION_KEY`
- Auto-generated on first run if missing
- All account passwords are encrypted before storage and decrypted only at send time

**Functions**: `encrypt_password(plain) → encrypted`, `decrypt_password(encrypted) → plain`

### 5.9 Template & Variable Engine

**File**: `core/template_engine.py`

- `render_template(template, context)`: Replaces `{VarName}` with values from context dict
- `process_spintax(text)`: Resolves `{option1|option2|option3}` to a random choice. Supports nesting.

**File**: `core/variable_manager.py`

- System variables: `{SenderName}`, `{SenderEmail}`, `{Date}`, `{Day}`, `{Time}`, `{Month}`, `{Year}`, `{CampaignName}`, `{RowNumber}`
- Custom variables: User-defined with default values, stored in `variable_definitions` table

### 5.10 Other Core Modules

| Module | File | Purpose |
|--------|------|---------|
| Gmail Client | `core/gmail_client.py` | OAuth2 authentication via Google API. Token refresh. Send via Gmail API. |
| Outlook Client | `core/outlook_client.py` | MSAL authentication via Microsoft Graph API. Send via Graph `/sendMail`. |
| Generic SMTP | `core/imap_client.py` | `GenericSMTPClient` for any SMTP server + `YahooClient` subclass. |
| Rotation Manager | `core/rotation_manager.py` | Round-robin or weighted random account selection. |
| Bounce Handler | `core/bounce_handler.py` | IMAP scan for NDR/bounce emails → auto-blacklist bounced addresses. |
| Export Engine | `utils/export_engine.py` | Generate campaign reports as PDF (ReportLab) or Excel (openpyxl). |
| Timezone Utils | `utils/timezone_utils.py` | TLD-based timezone detection + "schedule for 9 AM" calculator. |

---

## 6. Frontend: `mailblast-web/`

### 6.1 Tech Stack & Design System

**Theme**: Light theme with clean, professional aesthetic.

**Color palette**:
| Token | Value | Usage |
|-------|-------|-------|
| Primary Blue | `#1297FD` | Primary actions, active states, links |
| Background | `#FAFAFA` | Page background |
| Surface | `#FFFFFF` | Cards, modals |
| Surface Alt | `#F2F3F5` | Input backgrounds, table headers |
| Border | `#E8E9EC` | Card borders, dividers |
| Border Input | `#D8DADF` | Input borders |
| Text Primary | `#0C0D10` | Headings, body text |
| Text Secondary | `#474A56` | Descriptions |
| Text Muted | `#8D909C` | Labels, metadata |
| Success | `#22C55E` | Sent status, positive metrics |
| Error | `#EF4444` | Failed status, destructive actions |
| Warning | `#F59E0B` | Pending status, scheduler |
| Purple | `#A855F7` / `#7C3AED` | Lifetime stats, prompts |

**Typography**: Bricolage Grotesque (headings), Instrument Sans (body), Fira Code / JetBrains Mono (monospace)

**UI patterns**:
- Cards: `bg-white border border-[#E8E9EC] rounded-2xl shadow-sm`
- Inputs: `bg-white border border-[#D8DADF] rounded-lg focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)]`
- Primary button: `bg-[#1297FD] text-white hover:bg-[#0A82E0] rounded-lg shadow-sm`
- Status pills: Rounded-full with subtle background + border
- Page max-width: `max-w-[1200px]` to `max-w-[1600px]`

### 6.2 All Pages

#### Landing Page (`/`) — `page.tsx` (67KB)
Full marketing landing page with animated sections. When `pathname === '/'`, no sidebar is rendered.

#### Dashboard (`/dashboard`)
- Time range selector: Last 24h, 7d, 30d, 1y, Forever
- Stat cards: Lifetime Total, Period Sends, Open Rate, Failed/Bounced
- Dispatch Volume bar chart (Recharts)
- Recent Activity table (top 5 campaigns with send/open counts)
- Live data indicator badge
- Fetches: `GET /api/analytics/stats`, `GET /api/analytics/open-rate-history`, `GET /api/analytics/recent-campaigns`

#### Composer (`/composer`)
- Two states: **Editor** (campaign setup) and **Progress** (live dispatch monitoring)
- Uses the shared `<CampaignEditor mode="instant" />` component
- Progress view: animated progress bar, sent/failed/pending counters, live scrolling log
- Polls campaign status every 2 seconds during dispatch
- Fetches: `GET /api/campaigns/{id}`, `GET /api/analytics/send-log?campaign_id={id}`

#### Campaign Editor (`CampaignEditor.tsx` — 392 lines)
**Modes**: `instant` (direct launch) and `scheduled` (pick datetime)

**Three-column layout**:
1. **Config column**: Campaign name, mode toggle (Bulk/Single), file upload, attachment upload, delay interval, test mode toggle, sender account selector
2. **Editor column**: Subject input, TipTap rich text editor, action buttons
3. **Variables column**: Clickable variable pills (insert into body or subject), data preview table

**Key features**:
- Bulk mode: Upload CSV/XLSX/XLS/Numbers → auto-detect email column → expand multi-email cells (comma/semicolon separated)
- Single mode: Direct recipient email input
- Test mode: Override recipients, flag campaign as `is_test`
- Variable insertion: Toggle between inserting into Subject vs Body
- Draft persistence: Loads subject/body from localStorage (set by AI Studio transfer)
- Delay modes: 10s (Fast), 15s (Standard), 30s (Safe), 60s (Stealth), Custom
- Attachment support: Upload folder → match filename via column variable

#### All Campaigns (`/campaigns`)
Lists all campaigns with status, sent count, open rate. Click → campaign detail page.

#### Campaign Detail (`/campaigns/[id]`)
Full campaign view with stats, email log, open tracking data.

#### Scheduler (`/scheduler`)
- Two views: Job list and New schedule form
- Job list: Shows pending/running scheduled jobs with campaign name, type (single/bulk), scheduled time
- Cancel button for each job
- "Add Schedule" opens the same `<CampaignEditor mode="scheduled" />` component
- Polls job list every 5 seconds
- Fetches: `GET /api/scheduler/list`, `DELETE /api/scheduler/jobs/{id}`

#### AI Studio (`/ai-studio`)
- Two modes toggle: **Templates** (product/audience/tone fields) and **Custom Prompt** (free-form textarea)
- Generates via `POST /api/ai/generate`
- Output panel: readonly subject + HTML-rendered body preview
- "Transfer to Composer" button: saves to localStorage, navigates to `/composer`
- Copy button for generated content

#### Analytics (`/analytics`)
- Same time range selector as Dashboard
- Three stat cards: Total Dispatched, Unique Opens, Bounces/Failed
- Historical Performance chart: side-by-side bars for Dispatches (blue) and Opens (green)
- Uses Recharts `<BarChart>` with gradient fills

#### Sent Logs (`/sent`)
- Full send log table: Timestamp, Recipient, Sender, Status, Details button
- Account filter dropdown
- Detail modal: Shows reconstructed subject/body (with variables filled in), engagement data (open count), attachment info
- **Live WebSocket updates**: Connects to `ws://localhost:8000/ws/live-log`
  - `opened` events: Updates open count in-place
  - `sent`/`failed` events: Refreshes full log

#### Warm-Up (`/warmup`)
- Three stat cards: Network Pool, Avg Deliverability, Interactions Today
- Account table: email, reputation score (progress bar), daily limit, warm-up status (WARMING/PAUSED)
- Start/Stop toggle per account
- Fetches: `GET /api/warmup/status`, `GET /api/warmup/stats`, `POST /api/warmup/toggle/{id}`

#### Accounts (`/accounts`)
- CRUD for email accounts
- "Add Gmail" and "Add Custom SMTP" quick-add buttons
- Account table: Provider, Display Name, Email, Status, Edit/Delete actions
- Modal form: Credentials (name, email, password) + SMTP/IMAP server config
- Passwords encrypted on backend via Fernet
- Fetches: `GET /api/accounts`, `POST /api/accounts/add`, `PUT /api/accounts/{id}`, `DELETE /api/accounts/{id}`

#### Templates (`/templates`)
Template management page.

#### Blacklist (`/blacklist`)
Email suppression list management.

#### Settings (`/settings`)
- Groq API Key: show/save (masked input)
- Warm-Up Seed List: textarea, line-separated emails
- Database path: readonly display
- Fetches: `GET /api/settings/get_groq`, `POST /api/settings/update_groq`, `GET /api/settings/get_seeds`, `POST /api/settings/update_seeds`

### 6.3 Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `layout/Sidebar.tsx` | 12-link navigation. Collapsible (desktop). Hamburger menu (mobile). Active state highlighting. |
| `AppLayoutWrapper` | `layout/AppLayoutWrapper.tsx` | Conditional layout: landing page = no sidebar; all other routes = sidebar + main content. |
| `SmoothScroll` | `layout/SmoothScroll.tsx` | Lenis smooth scroll wrapper. |
| `ModalContext` | `context/ModalContext.tsx` | Global modal system: `showAlert()`, `showConfirm()`, `showPrompt()`. Framer Motion animated. Themed by type. |
| `RichTextEditor` | `Editor/RichTextEditor.tsx` | TipTap editor with: Bold, Italic, Underline, Strikethrough, H1-H3, Bullet/Ordered lists, Text alignment, Font color (hex picker), Link editing (bubble menu), Placeholder text. |
| `Toolbar` | `Editor/Toolbar.tsx` | Editor toolbar with formatting buttons. |
| `StatCard` | `ui/StatCard.tsx` | Reusable stat display card. |
| `TerminalLog` | `ui/TerminalLog.tsx` | Terminal-style log display. |
| `OpenRateChart` | `charts/OpenRateChart.tsx` | Recharts chart component. |
| `CampaignEditor` | `CampaignEditor.tsx` | The main campaign editor (see detailed description above). |

---

## 7. Complete API Reference

### AI Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/generate` | Generate email from brief |
| `POST` | `/api/ai/rewrite` | Rewrite draft with instruction |
| `POST` | `/api/ai/subjects` | Generate N subject lines |

### Attachment Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/attachments/upload` | Upload attachment files (returns `batch_id`) |

### Campaign Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/campaigns` | List all campaigns |
| `GET` | `/api/campaigns/{id}` | Get single campaign |
| `POST` | `/api/campaigns/{id}/start` | Start campaign (APScheduler bridge) |
| `POST` | `/api/campaigns/{id}/stop` | Stop campaign |
| `POST` | `/api/campaign/launch` | Launch campaign immediately |
| `POST` | `/api/campaign/{id}/pause` | Pause running campaign |
| `POST` | `/api/campaign/{id}/resume` | Resume paused campaign |
| `POST` | `/api/campaign/{id}/cancel` | Cancel campaign (re-queues pending items) |

### Test Send
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/test-send` | Send single test email |

### Scheduler Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scheduler/create` | Schedule bulk campaign |
| `POST` | `/api/scheduler/single` | Schedule single email |
| `GET` | `/api/scheduler/list` | List pending/running jobs |
| `DELETE` | `/api/scheduler/jobs/{id}` | Cancel scheduled job |

### Analytics Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/stats?range={range}` | Global stats (sent, opened, failed, open_rate) |
| `GET` | `/api/analytics/recent-campaigns` | Last 5 campaigns with stats |
| `GET` | `/api/analytics/open-rate-history?range={range}` | Dispatch history bucketed by time |
| `GET` | `/api/analytics/send-log?campaign_id={id}&limit={n}` | Send log entries |
| `GET` | `/api/analytics/send-log/{log_id}/details` | Detailed log entry with reconstructed email |

### Tracking Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/t/o/{tracking_id}.gif` | Open tracking pixel (returns 1x1 GIF) |

### Settings Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings/get_groq` | Get Groq API key |
| `POST` | `/api/settings/update_groq` | Update Groq API key |
| `GET` | `/api/settings/get_seeds` | Get warm-up seed list |
| `POST` | `/api/settings/update_seeds` | Update warm-up seed list |

### Account Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/accounts` | List all accounts |
| `POST` | `/api/accounts/add` | Add new account |
| `PUT` | `/api/accounts/{id}` | Edit account |
| `DELETE` | `/api/accounts/{id}` | Delete account |
| `POST` | `/api/accounts/gmail/auth-url` | Get Gmail OAuth URL |

### Warm-Up Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/warmup/toggle/{id}` | Start/stop warm-up for account |
| `GET` | `/api/warmup/status` | Get active warm-up account IDs |
| `GET` | `/api/warmup/stats` | Get warm-up aggregate stats |

### WebSocket
| Path | Description |
|------|-------------|
| `ws://localhost:8000/ws/live-log` | Real-time campaign events (sent, failed, opened, status) |

### Health
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (`{"status": "ok"}`) |

---

## 8. Database Schema (All 11 Tables)

### `accounts`
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
provider        TEXT NOT NULL          -- 'Gmail', 'Custom Domain', etc.
email           TEXT NOT NULL UNIQUE
display_name    TEXT
token_path      TEXT                   -- Path to OAuth token file
imap_host       TEXT
imap_port       INTEGER DEFAULT 993
smtp_host       TEXT
smtp_port       INTEGER DEFAULT 587
smtp_security   TEXT DEFAULT 'STARTTLS'
username        TEXT
encrypted_pass  TEXT                   -- Fernet AES-256 encrypted
daily_limit     INTEGER DEFAULT 0      -- 0 = unlimited
warmup_mode     INTEGER DEFAULT 0
warmup_day      INTEGER DEFAULT 0
total_sent      INTEGER DEFAULT 0
reputation_score INTEGER DEFAULT 100
is_active       INTEGER DEFAULT 1
created_at      TEXT DEFAULT CURRENT_TIMESTAMP
```

### `campaigns`
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
name            TEXT NOT NULL
account_ids     TEXT                   -- JSON array of account IDs
rotation_mode   TEXT DEFAULT 'single'  -- single | round_robin | random
subject         TEXT
body_plain      TEXT
body_html       TEXT
use_html        INTEGER DEFAULT 0
tracking_enabled INTEGER DEFAULT 1
click_tracking  INTEGER DEFAULT 1
campaign_type   TEXT DEFAULT 'campaign' -- 'campaign' | 'single'
status          TEXT DEFAULT 'draft'   -- draft | scheduled | running | paused | completed | cancelled
total           INTEGER DEFAULT 0
sent            INTEGER DEFAULT 0
failed          INTEGER DEFAULT 0
opened          INTEGER DEFAULT 0
clicked         INTEGER DEFAULT 0
bounced         INTEGER DEFAULT 0
unsubscribed    INTEGER DEFAULT 0
scheduled_at    TEXT
timezone        TEXT
created_at      TEXT DEFAULT CURRENT_TIMESTAMP
started_at      TEXT
finished_at     TEXT
is_test         INTEGER DEFAULT 0
delay_seconds   INTEGER DEFAULT 5
```

### `send_log`
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
campaign_id     INTEGER REFERENCES campaigns(id)
account_id      INTEGER REFERENCES accounts(id)
recipient       TEXT NOT NULL
website         TEXT
row_data        TEXT                   -- Full JSON of the Excel/CSV row
status          TEXT                   -- queued | processing | sent | failed | retrying | cancelled | scheduled
error_msg       TEXT
tracking_id     TEXT UNIQUE            -- UUID for open tracking
retry_count     INTEGER DEFAULT 0
next_retry_at   TEXT                   -- ISO UTC timestamp for next retry
opened          INTEGER DEFAULT 0
open_count      INTEGER DEFAULT 0
first_opened_at TEXT
last_opened_at  TEXT
clicked         INTEGER DEFAULT 0
click_count     INTEGER DEFAULT 0
bounced         INTEGER DEFAULT 0
sent_at         TEXT DEFAULT CURRENT_TIMESTAMP
sender_ignore_until TEXT               -- ISO UTC. 60s cooldown for sender opens
```

### `tracking_events`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
tracking_id TEXT REFERENCES send_log(tracking_id)
event_type  TEXT                       -- 'open' | 'click'
ip_address  TEXT
user_agent  TEXT
url_clicked TEXT
occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
```

### `scheduled_jobs`
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
campaign_id     INTEGER REFERENCES campaigns(id)
scheduled_at    TEXT NOT NULL           -- ISO datetime UTC
timezone        TEXT
local_time      TEXT
status          TEXT DEFAULT 'pending'  -- pending | running | done | cancelled | missed | failed
apscheduler_id  TEXT UNIQUE
created_at      TEXT DEFAULT CURRENT_TIMESTAMP
```

### `templates`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT NOT NULL
subject     TEXT
body_plain  TEXT
body_html   TEXT
variables   TEXT                       -- JSON list of variable names
use_html    INTEGER DEFAULT 0
created_at  TEXT DEFAULT CURRENT_TIMESTAMP
updated_at  TEXT
```

### `blacklist`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
email       TEXT UNIQUE NOT NULL
reason      TEXT                       -- 'bounced' | 'unsubscribed' | 'manual'
added_at    TEXT DEFAULT CURRENT_TIMESTAMP
```

### `variable_definitions`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT UNIQUE NOT NULL
description TEXT
default_val TEXT
column_hint TEXT
created_at  TEXT DEFAULT CURRENT_TIMESTAMP
```

### `ai_history`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
engine      TEXT                       -- e.g. 'groq/llama-3.3-70b'
prompt      TEXT
output      TEXT
tokens_used INTEGER
created_at  TEXT DEFAULT CURRENT_TIMESTAMP
```

### `warmup_log`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
account_id  INTEGER REFERENCES accounts(id)
day_number  INTEGER
emails_sent INTEGER
target      INTEGER
success_rate REAL
date        TEXT DEFAULT CURRENT_DATE
```

### `internal_ips`
```sql
ip              TEXT
user_agent      TEXT
last_seen       TEXT DEFAULT CURRENT_TIMESTAMP
PRIMARY KEY (ip, user_agent)
```

---

## 9. WebSocket Protocol

**Endpoint**: `ws://localhost:8000/ws/live-log`

**Keep-alive**: Server sends `{"type": "ping"}` every 30 seconds.

**Event types broadcast by the system**:

```json
// Email sent successfully
{"type": "sent", "campaign_id": 42, "recipient": "user@example.com", "status": "sent"}

// Email failed
{"type": "failed", "campaign_id": 42, "recipient": "user@example.com", "status": "failed"}

// Email opened (tracking pixel loaded)
{"type": "opened", "log_id": 123, "campaign_id": 42, "open_count": 1}

// Campaign status changed
{"type": "status", "campaign_id": 42, "status": "completed"}  // or "paused", "running", "cancelled"
```

---

## 10. Environment Variables

**File**: `mailblast-omega/.env`

```env
# AI Engine (required for AI Studio)
GROQ_API_KEY=gsk_YOUR_KEY_HERE

# Tracking (the domain where tracking pixels are served)
TRACKING_DOMAIN=https://your-ngrok-or-domain.app  # or http://localhost:8000
TRACKING_SERVER_URL=http://localhost:5500           # Flask tracking server (legacy)
TRACKING_SERVER_PORT=5500
FRONTEND_URL=http://localhost:3000

# Security (auto-generated on first run, DO NOT CHANGE after accounts are added)
ENCRYPTION_KEY=YOUR_FERNET_KEY_HERE

# Optional
NGROK_AUTH_TOKEN=
```

> **CRITICAL**: If `ENCRYPTION_KEY` is changed or lost, ALL stored account passwords become unrecoverable.

---

## 11. Key Behavioral Rules & Gotchas

### ⚠️ CRITICAL: Do Not Break These

1. **Queue Worker is the ONLY dispatcher**: All campaign emails go through the `SequentialQueueWorker`. Never bypass it by sending directly from an API endpoint (except `test-send`).

2. **SMTP Connection Pool limit is 8**: The `ThreadPoolExecutor` is capped at 8 workers. This prevents ISP lockout and system freezing. DO NOT increase this without understanding SMTP rate limits.

3. **Tracking pixel URL must match `TRACKING_DOMAIN`**: The tracking pixel URL is baked into the email HTML at send time. If `TRACKING_DOMAIN` changes, old emails' tracking breaks.

4. **60-second sender cooldown**: `log_send()` auto-sets `sender_ignore_until` to 60 seconds after send. This is essential to block false opens from the sender's own email client pre-loading the tracking pixel.

5. **IP fingerprinting is critical**: The middleware registers every management API request's IP + User-Agent in `internal_ips`. This data is used to filter sender opens in tracking. Do not remove this middleware.

6. **Database WAL mode**: The SQLite database uses WAL mode for concurrent access. The `_get_conn()` method creates a new connection per call (thread-safe pattern). Context managers are used for auto-commit.

7. **Background IMAP sync is fire-and-forget**: After sending, a daemon thread appends the email to the sender's IMAP Sent folder. It must NEVER block the main dispatch loop. Errors are logged but swallowed.

8. **Encryption key in .env is the master secret**: All account passwords are encrypted with the Fernet key. Losing or changing it means all accounts must be re-added.

9. **Frontend fetches to `http://localhost:8000`**: All API calls are hardcoded to `http://localhost:8000`. If the backend port changes, update all frontend fetch calls.

10. **The landing page (`page.tsx`) at `/` is 67KB**: It's a complete marketing page. The `AppLayoutWrapper` detects `pathname === '/'` and renders without the sidebar.

### Common Patterns

- **Campaign lifecycle**: `draft` → `running` → `completed` (or `paused` → `running` → `completed`, or `cancelled`)
- **Send log lifecycle**: `queued` → `processing` → `sent` / `failed` / `retrying` → (eventually) `sent` / `failed`
- **Scheduled lifecycle**: `scheduled` → `pending` → `running` → `done`
- **All timestamps**: ISO 8601 format, stored as TEXT in SQLite
- **All IDs**: Auto-incrementing integers (not UUIDs), except `tracking_id` which is UUID

### Coding Conventions

- Backend uses lazy imports (inside functions) for circular dependency avoidance
- `from data.db import get_db` is the standard way to access the database
- `sync_broadcast()` bridges sync (thread) → async (WebSocket) event delivery
- Frontend uses `'use client'` on all page components (Next.js App Router)
- All API fetches use `http://localhost:8000` (no environment variable on frontend)
- Framer Motion is used for all page transitions and component animations
- Tailwind classes follow a consistent pattern: `bg-[#hex]`, `text-[#hex]`, `border-[#hex]`

---

## 12. Feature Status Matrix

| Feature | Status | Location |
|---------|--------|----------|
| Dashboard Analytics | ✅ Working | `/dashboard` + `/api/analytics/*` |
| Campaign Composer (Bulk) | ✅ Working | `/composer` + `CampaignEditor.tsx` |
| Campaign Composer (Single) | ✅ Working | `/composer` (Single mode toggle) |
| Rich Text Editor | ✅ Working | `RichTextEditor.tsx` (TipTap) |
| Hex Color Picker | ✅ Working | `Toolbar.tsx` |
| Excel/CSV Upload | ✅ Working | `CampaignEditor.tsx` (SheetJS) |
| Dynamic Attachments | ✅ Working | Upload folder + match by column |
| Variable Substitution | ✅ Working | `{Variable}` syntax in subject/body |
| Test Mode | ✅ Working | Toggle in Composer |
| Campaign Controls | ✅ Working | Pause/Resume/Cancel |
| Retry Engine | ✅ Working | 3 attempts, exponential backoff |
| SMTP Connection Pool | ✅ Working | 8-connection LifoQueue per account |
| IMAP Shadow Sync | ✅ Working | Background thread after send |
| Open Tracking (5-layer) | ✅ Working | `/api/t/o/{id}.gif` |
| Click Tracking | ✅ Working | Flask `/c/{id}` |
| Unsubscribe | ✅ Working | Flask `/unsub/{id}` |
| AI Email Generation | ✅ Working | Groq LLaMA 3.3 70B |
| AI → Composer Transfer | ✅ Working | localStorage bridge |
| Campaign Scheduling | ✅ Working | APScheduler + `/scheduler` |
| Single Email Scheduling | ✅ Working | `/api/scheduler/single` |
| Inbox Warm-Up | ✅ Working | 25-day progressive schedule |
| Account Management | ✅ Working | CRUD + Fernet encryption |
| Sent Log (with details) | ✅ Working | `/sent` + detail modal |
| WebSocket Live Updates | ✅ Working | `ws://localhost:8000/ws/live-log` |
| Settings (API Key, Seeds) | ✅ Working | `/settings` |
| Landing Page | ✅ Working | `/` (67KB marketing page) |
| PDF/Excel Exports | ✅ Exists | `utils/export_engine.py` (no UI) |
| Bounce Handler | ✅ Exists | `core/bounce_handler.py` (no UI) |
| Rotation (Round Robin) | ✅ Exists | `core/rotation_manager.py` |
| Templates Page | ⚠️ Stub | `/templates` (page exists, minimal) |
| Blacklist Page | ⚠️ Stub | `/blacklist` (page exists, minimal) |
| OAuth Gmail Flow (Web) | ⚠️ Partial | Auth URL endpoint exists |
| Desktop GUI | 🔴 Legacy | `app.py` (CustomTkinter, not used in web mode) |

---

> **End of Documentation**. This file contains everything an AI agent needs to understand the complete MailBlast OMEGA system and safely develop new features without breaking existing functionality.
