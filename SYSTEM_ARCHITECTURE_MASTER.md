# MailBlast OMEGA — Master System Architecture & Context Guide

> **Purpose**: This document is the absolute source-of-truth for the MailBlast OMEGA email automation platform. It is designed to provide complete technical context for any AI coding agent or developer to continue development, solve bugs, or scale the system without breaking core logic.

---

## 1. System Vision & Design Principles

**MailBlast OMEGA** is built for high-performance, resilient, and non-blocking email automation. Its architecture follows three core principles:
1.  **Non-Blocking UI**: Background processes (dispatching, syncing, tracking) must never interfere with the responsiveness of the dashboard.
2.  **Stealth Tracking**: Open tracking uses a 5-layer validation pipeline to eliminate false positives from ISP scans, proxies, and sender-side opens.
3.  **Resource Resilience**: The system is optimized for Render's Free Tier, including anti-sleep mechanics and memory-safe concurrency limits.

---

## 2. Global Architecture

The system consists of three main components communicating in a triangle:

1.  **Frontend (Next.js 14)**: A React-based interface using TailwindCSS and Framer Motion. It handles all user interaction, campaign composition, and live analytics visualization (Recharts).
2.  **Backend (FastAPI)**: A Python-based API that manages the core business logic, email queue worker, scheduler, and AI generation engine (Groq).
3.  **Database (PostgreSQL/Supabase)**: A centralized PostgreSQL database (hosted on Supabase) that stores all accounts, campaigns, logs, and tracking events.

---

## 3. Backend Deep-Dive: `mailblast-omega/`

### 3.1 Startup & Lifecycle
The backend is powered by **FastAPI** (`api_bridge.py`). On startup (`@app.on_event("startup")`), it initializes:
-   **`SequentialQueueWorker`**: The main background daemon that manages campaign execution.
-   **`AntiSleepManager`**: A specialist thread that prevents Render's auto-sleep (see section 3.4).
-   **`SchedulerEngine`**: Reloads all pending jobs from the database into memory.
-   **Trash Cleanup**: A 24-hour cycle background task to remove expired items from the trash.

### 3.2 Thread Isolation & Worker Strategy
To maintain performance and prevent "system freezes," the `SequentialQueueWorker` uses two dedicated thread pools:
-   **`Dispatch Executor` (max 10 threads)**: Handles the physical SMTP handshake and email delivery.
-   **`Sync Executor` (max 5 threads)**: Handles "Shadow IMAP Syncing"—appending sent emails to the recipient's Sent folder without delaying the next dispatch.

### 3.3 Atomic Database Strategy
**Connection Rule**: A database connection is **never** held during a network call (SMTP, IMAP, AI).
1.  Open connection → Update status in DB → **Close immediately**.
2.  Perform slow network operation (e.g., `smtp.send_message`).
3.  Open connection → Record result → **Close immediately**.
This ensures that the Web UI always has available slots in the connection pool.

### 3.4 Anti-Sleep Manager (Render-Specific)
Render's Free Tier spins down services after 15 minutes of HTTP inactivity. The `AntiSleepManager` solves this:
-   It monitors the `active_runners` list.
-   If at least one campaign is running, it makes a lightweight `GET` request to its own `/health` endpoint every 10 minutes.
-   This keeps the service alive until the campaign completes, even if the user closes their dashboard.

---

## 4. Database Deep-Dive: PostgreSQL/Supabase

### 4.1 Connection Pool (Self-Healing)
The database layer (`data/db_postgres.py`) implements a `ThreadedConnectionPool`:
-   **Capacity**: 60 connections (optimized for Supabase direct-connection limits).
-   **Fallback Mechanics**: If the pool is exhausted (e.g., during an extreme burst), the `_get_conn` wrapper will automatically open a **direct connection** (`psycopg2.connect`) as a fail-safe to keep the UI responsive.

### 4.2 Multi-Tenant Data Isolation
Every database query uses a `user_id` filter (fetched from the `X-User-Id` header via `ContextVars`) to ensure data isolation between different authenticated users.

---

## 5. Stealth Tracking: The 5-Layer Pipeline

Open tracking (`/api/t/o/{id}.gif`) implements a rigorous validation pipeline:

| Layer | Type | Logic |
| :--- | :--- | :--- |
| **1. Timing** | ISP Scan Block | Rejects opens within the first 60 seconds of send (likely a preload/scan). |
| **2. Identity** | Sender Fingerprint | Cross-references IP + User-Agent against known internal sessions from the `internal_ips` table. |
| **3. Infrastructure**| Proxy Detection | Detects common proxies (Google, Microsoft, AWS) and validates them against the recipient's domain. |
| **4. Behavioral** | Burst Protection | Detects "scrolling" behavior by blocking an IP prefix if it hits >2 distinct IDs in <2 minutes. |
| **5. Deduplication** | First Open Only | Only the first *verified* open increments the unique count; subsequent opens only increment `open_count`. |

---

## 6. Frontend Deep-Dive: `mailblast-web/`

### 6.1 Authentication & The Fetch Interceptor
The `AuthContext.tsx` uses a custom `window.fetch` interceptor:
-   It automatically injects the `X-User-Id` header into every request targeting the backend API.
-   This enables the backend to associate data with the correct Subabase user without requiring complex JWT parsing on every internal operation.

### 6.2 Visibility-Aware Polling (VAP)
To reduce server load and prevent Render timeouts, all dashboards use a "Visibility-Aware" strategy:
-   **Composer**: Polls every 5s.
-   **Campaigns**: Polls every 10s.
-   **Scheduler**: Polls every 15s.
-   **Interruption**: Polling **stops completely** if the user switches browser tabs (`document.hidden`).

---

## 7. Deployment & Infrastructure

-   **Primary Region**: Singapore (Singapore AWS/Render) to match the Supabase database region, reducing cross-region latency to <2ms.
-   **Entry Point**: `start.sh` binds the Uvicorn server to the `$PORT` assigned by Render and forces 1 worker to ensure thread safety.
-   **Storage**: Attachment uploads are currently ephemeral (`/uploads`).

---

## 8. Directory & Implementation Map

```text
/
├── mailblast-omega/           # ── BACKEND ──
│   ├── api_bridge.py          # Entry point, workers, managers, endpoints.
│   ├── data/
│   │   └── db_postgres.py     # ALL SQL queries, connection pool, fallback logic.
│   ├── core/
│   │   ├── scheduler_engine.py# Job persistence, timezone-aware triggers.
│   │   ├── ai_generator.py    # LLaMA 3.3 orchestration via Groq.
│   │   └── warmup_engine.py   # Progressive deliverability ramp-up (25 days).
│   └── start.sh               # Production startup script.
│
├── mailblast-web/             # ── FRONTEND ──
│   ├── src/app/               # App Router pages.
│   ├── src/context/           # Global Auth/Modal states.
│   └── src/components/        # UI library & CampaignEditor core.
```

---

## 9. Full Database Schema (PostgreSQL)

| Table | Purpose |
| :--- | :--- |
| `accounts` | SMTP/IMAP credentials (passwords AES-256 encrypted). |
| `campaigns` | Metadata, stats, templates, and delay settings. |
| `send_log` | Per-email status log (queued, sent, failed, opened). |
| `tracking_events` | Raw logs of every open event (IP, UA, timestamp). |
| `scheduled_jobs` | Pending tasks for APScheduler to pick up. |
| `internal_ips` | Registering known sender IPs to prevent self-tracking. |
| `blacklist` | Suppression list (bounces, unsubscribes). |
| `templates` | Saved HTML email drafts. |

---

> [!TIP]
> **Developer Note**: When adding a new API endpoint, always wrap DB calls in `with get_db()._get_conn() as conn:` blocks to ensure connections are automatically returned to the `ThreadedConnectionPool`.
