# MailBlast OMEGA: System Architecture & Context

This document provides absolute context regarding the current state, architecture, and "locked" foundational systems of the **MailBlast OMEGA** email platform. It is designed to be fed into a new AI chat context to ensure future scalability without breaking the existing high-speed backend engine.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Python 3, FastAPI, Uvicorn, APScheduler, WebSockets.
- **Database:** SQLite (WAL mode enabled), raw SQL execution.

---

## 🔒 The Core Delivery Engine (LOCKED)

The underlying dispatch engine is finalized. **DO NOT modify the core architecture of `api_bridge.py` without overwhelming justification, as it contains extremely delicate concurrency balancing.**

### 1. `SMTPConnectionPool` (Thread-Safe Sockets)
Because standard Python `smtplib.SMTP` is **not thread-safe**, sharing a socket across threads caused critical 500-level errors, deadlocks, and corrupted payloads (e.g., interleaving byte boundaries between emails).
- We implemented a strict **Connection Pool** utilizing `queue.LifoQueue()`.
- Every active worker thread mathematically checks out a dedicated, exclusive, fully-authenticated Socket. 
- Dead sockets are automatically cleaned and re-authenticated on-the-fly without crashing the worker.

### 2. Burst Pacing & Thread Limits (`max_workers=8`)
The system is capable of blazing fast delivery (e.g., 0.1s delay between emails).
- The `SequentialQueueWorker` loop fetches emails in **batches of 100**.
- The main queue loop executes strict mathematical `time.sleep()` staggering (accurate to the millisecond) before injecting the task into the background execution pool.
- **CRITICAL RESTRICTION:** The `ThreadPoolExecutor` is strictly capped at `max_workers=8`. This prevents the IP from negotiating 60+ simultaneous TLS pipelines with providers like Gmail/Microsoft, which natively results in instant IP tarpitting, Blacklisting, and `[Errno 32] Broken Pipe` freezes. **DO NOT change this limit.** 8 connections are fast enough to safely max out consumer rate limits natively.

### 3. RFC 5322 Hardened Output
- `_build_email_message` natively builds dual `multipart/alternative` and `multipart/mixed` outputs.
- Contains explicit `Message-ID` injection (`make_msgid()...`) and `Reply-To`. Without this, standard spam filters (Gmail/Outlook) natively blackhole/silently drop the payload as Spam Bot traffic during high-velocity burst sending.

### 4. Background IMAP Sync
- Sent emails are natively synced to the provider's `Sent` folder securely in a non-blocking Fire-and-Forget thread (`background_imap_sync()`).

---

## Real-Time Frontend Sync

- **WebSocket Log Injection:** The backend connects to `ws://localhost:8000/ws/live-log` to send instant `'sent'`, `'failed'`, and `'opened'` telemetry UI updates.
- **Container Cleanup:** The `GET /api/send-log` endpoint natively filters out `.status = 'queued'` so that the user UI visually begins completely empty until real dispatching starts.
- **Instant Controls:** The execution loops contain strict database `SELECT status` intercepts exactly *millisecond before* execution. If a Campaign is `Paused` or `Cancelled`, the batch instantly drops remaining emails back into the `queued` pool.

---

## Development Constraints For New AI Assistants

1. **Security/Settings:** Do not touch the AES256 `credential_vault.py`.
2. **Speed Issues:** If you encounter UI slowdowns when fetching Logs (Campaign Details), implement frontend pagination. **Never** revert the backend queue speed setting or rip out the `SMTPConnectionPool` in an attempt to optimize.
3. **Delivery Failures:** If a user selects exactly `0.1s` and emails silently disappear at the provider level, it is the Provider Blackholing them for volume, *not* a system bug. The system will cleanly report `250 OK`. Ask the user to raise the `delay_seconds` to exactly `5s` or `15s` for consumer accounts before trying to "fix" the backend.
