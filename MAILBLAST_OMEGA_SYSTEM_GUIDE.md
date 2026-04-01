# 🌌 MailBlast OMEGA: The Ultimate System Master Guide (v3.0)

This is the **absolute source of truth** for MailBlast OMEGA. Every module, every logic gate, and every data bridge is documented here. Use this guide to understand, maintain, or expand the system without missing a single detail.

---

## 🏗️ 1. ARCHITECTURE & TECHNOLOGY STACK

MailBlast OMEGA is built on a **High-Performance Decoupled Stack**, separating the presentation layer from the heavy-duty email processing engine.

### 🍱 Frontend (Next.js 14)
- **Path**: `mailblast-web/`
- **Core**: React 18, Next.js 14 (App Router).
- **Styling**: Vanilla CSS (Global aesthetics) + TailwindCSS (Utilities).
- **Authentication**: Supabase Auth (Implicit & PKCE).
- **Visuals**: 
  - **Framer Motion**: Parallelized entrance/exit animations.
  - **Lucide Icons**: Consistent iconography.
  - **Glassmorphism**: Backdrop blur effects on modals and cards.

### ⚙️ Backend (FastAPI)
- **Path**: `mailblast-omega/`
- **Engine**: FastAPI 0.100+.
- **Worker**: `SequentialQueueWorker` (Multi-threaded, parallel handshake, serial dispatch).
- **Security**: AES-256 (Fernet) for credential encryption.
- **AI**: Groq API (Llama-3-70B model) for near-zero latency text generation.

---

## 🔐 2. AUTHENTICATION & IDENTITY FLOW

The system uses a **Triple-Layer Identity Logic**.

### A. The Supabase Layer
- **Login/Signup**: Standard email-based identity.
- **Google OAuth**: Fast login with redirection to `/auth`.
- **Forgot Password (COMPLETE)**:
  1. User clicks "Forgot Password" -> `resetPassword` sends email.
  2. Email link returns user to `/auth#type=recovery&access_token=...`.
  3. `AuthPage.tsx` detects the hash -> switches to **Recovery Mode**.
  4. User enters new password -> `supabase.auth.updateUser` persists the change.

### B. The Fetch Interceptor (The Bridge)
- **Problem**: Next.js is separate from the Python API.
- **Solution**: `AuthContext.tsx` wraps `window.fetch`. It intercepts every network call to `localhost:8080/api` or `localhost:8000/api`.
- **Payload**: It injects an `X-User-Id` header (Supabase UID) into every request.
- **Resilience**: Fixed in v2.5 to handle `Headers` objects and `Request` cloning to prevent "Failed to fetch" errors.

### C. The Backend Middleware
- `api_bridge.py` middleware extracts the `X-User-Id` header.
- It stores it in a Python `ContextVar` (`current_user_id`).
- This variable is thread-local and safe for concurrent API requests.

---

## 🗄️ 3. DATABASE: SQLITE (WAL MODE)

- **Path**: `mailblast-omega/database/omega.db`
- **Engine**: SQLite 3 with `journal_mode=WAL` (required for concurrent read/writes by API and Worker).
- **Manual Commit Strategy**: All write operations in `db.py` use explicit `conn.commit()` to prevent locked databases.

### Key Data Isolation Policy
Every database lookup in `db.py` (e.g., `get_all_accounts`, `get_campaigns`) **MUST** filter by `user_id`:
```sql
SELECT * FROM table WHERE user_id = :uid
```
This ensures users never see or modify each other's data.

---

## 📧 4. DISPATCH ENGINE (THE WORKER)

The worker (`core/scheduler_engine.py`) is the most complex part of the system.

- **Staggering**: 0.1s - 1.0s wait between emails to bypass provider rate limits.
- **SMTP Pooling**: Keeps connections alive across batch chunks to save time.
- **Account Rotation**: Can rotate between multiple Gmail/SMTP accounts in a single campaign to increase total volume.
- **Success Criteria**: If SMTP response starts with `2` (e.g., `250 OK`), it's logged as `sent`. Anything else (4xx, 5xx) is logged as `failed`.

---

### B. Campaign Intelligence & Metadata
Every campaign now tracks deep execution metrics:
- **Status Lifecycle**: `Pending` → `Scheduled` → `Running` → `Completed` (or `Paused`/`Cancelled`).
- **Timing Benchmarks**:
  - `started_at`: Captured the millisecond the first email dispatches.
  - `finished_at`: Captured when the queue is exhausted.
  - **Execution Duration**: Automatically calculated (e.g., "12m 30s") to measure throughput and provider performance.
- **Attribution**: Transparently displays the sending email account(s) used for each specific campaign.

---

## 📈 5. ANALYTICS & SMART TRACKING

OMEGA uses a multi-layer validation engine to eliminate false positives.

### Tracking Logic
- **Pixel**: Transparent 1x1 GIF tracking.
- **Engagement Labels**: Automated 'Opened' vs 'Pending' status labeling in all logs.
- **Cooldown**: Blocks track within first 60s (prevents ISP false-opens).
- **IP Fingerprinting**: Registers sender's internal IP to ignore hits from self.
- **Advanced Filtering**: Full server-side filtering by **Sender Account** and **Engagement Status** in the "Sent" tab.

---

## 🗄️ 6. DATABASE SCHEMA (SQLite - WAL)

- **Path**: `mailblast-omega/database/omega.db`
- **Isolation**: Every query filters by `user_id` context variable.

| Table | Purpose | Multi-Tenant? |
| :--- | :--- | :--- |
| `accounts` | SMTP/IMAP Credentials (AES-256) | ✅ |
| `campaigns` | Metadata, Timing, and Status | ✅ |
| `send_log` | Per-email dispatch & open results | ✅ |
| `tracking_events` | Raw tracking hits for audit | Inherited |

---

## 🛠️ 7. CORE FEATURES MAP

1.  **AI Studio**: Full-canvas content generator with tone shifting (Llama-3-70B).
2.  **Warmup Engine**: Background thread simulating human behavior to boost IP reputation.
3.  **Campaign Intelligence**: Rich detail pages with status badges, timing metrics, and dispatch logs.
4.  **Sequential Dispatch**: Precise sub-second staggering to prevent provider blocking.
5.  **Multi-Filter Sent Logs**: Advanced server-side search and filtering for sent emails.

---

## 📜 8. THE GOLDEN RULES FOR AGENTS

1.  **NEVER BYPASS UID**: Retrieve `uid` from context; never query without multi-tenant filters.
2.  **QUEUE FIRST**: Do not trigger SMTP in API; write to `send_log` and let the worker dispatch.
3.  **STAY DATA-DRIVEN**: When enhancing UI, favor real metrics (timing, status, attribution).
4.  **PRESERVE AESTHETICS**: Maintain the Premium Light Mode (Framer Motion, soft borders, #1297FD).

---
*MailBlast OMEGA — Documented to the latest v3.5 feature set.*
