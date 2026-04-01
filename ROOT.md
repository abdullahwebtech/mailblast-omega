# MailBlast OMEGA - System Architecture & Tracking Root Cause

This document serves as a comprehensive technical reference for the MailBlast OMEGA email automation and tracking system. Its primary purpose is to provide the context necessary to resolve the **Sender-Side False Open** issue (where opens from the "Sent" folder are incorrectly recorded) without regressing the system's core performance.

---

## 1. System Overview

MailBlast OMEGA is a high-performance email automation engine designed for bulk dispatch with real-time analytics.

### Functional Flow:
1.  **Campaign Creation**: Users define a campaign (Subject, Body, Recipients) via the Frontend.
2.  **Queueing**: Campaigns are stored in the `campaigns` table and individual recipients are queued in the `send_log` table with a `pending` status.
3.  **Dispatch Worker**: A dedicated sender (logic in `core/sender.py` or equivalent) picks up `pending` logs, rotates through available SMTP/IMAP accounts, and transmits the email.
4.  **Injection**: During dispatch, a unique **Tracking ID** (UUID) is generated for each recipient and injected into the HTML body as a hidden 1x1 transparent GIF pixel.
5.  **Delivery**: Once successful, the log entry is marked as `sent` with a UTC `sent_at` timestamp.

---

## 2. Tracking System Breakdown

The tracking engine is "passive" and relies on the recipient's mail client requesting a remote image from the OMEGA backend.

### The Tracking Pixel:
- **URL Pattern**: `{TRACKING_DOMAIN}/api/t/o/{tracking_id}.gif`
- **Behavior**: When the pixel is requested, the backend validates the ID, updates the database, and returns a valid 1x1 transparent GIF with aggressive `no-cache` headers to ensure every subsequent open is also captured.

### The `mark_opened` Logic (Core Logic):
Located in `data/db.py`, this function is the "gatekeeper" for tracking. It currently employs a **5-Layer Shield** to prevent false positives:

1.  **Layer 1 (Cooldown)**: Rejects any hit within 20s of sending (blocks ISP spam scanners).
2.  **Layer 2 (Global Cooldown)**: Rejects hits within 60s of sending (blocks immediate pre-loads).
3.  **Layer 3 (Fingerprinting)**: Matches the `IP + User-Agent` against a registry of known sender sessions established during dashboard use.
4.  **Layer 4 (Proxy Filtering)**: Identifies Google/Microsoft image proxies. If a proxy hit occurs for a recipient whose email domain doesn't match the proxy (e.g., a Google Proxy hitting a Yahoo recipient), it is flagged as the **Sender viewing their Sent folder** and ignored.
5.  **Layer 5 (Burst Detection)**: If the same Proxy range hits multiple distinct IDs in a short burst (hallmark of scrolling the Sent folder), it is ignored.

---

## 3. Data Layer (Database)

**Primary File**: `database.db` (SQLite)
**Logic File**: `data/db.py`

### Relevant Tables:
- **`campaigns`**: Stores aggregate stats (`sent`, `opened`).
- **`send_log`**: The source of truth for individual emails.
    - `tracking_id`: Unique UUID for the pixel.
    - `sent_at`: UTC timestamp of transmission.
    - `opened`: Boolean flag (0/1).
    - `open_count`: Total number of times this specific email was opened.
    - `sender_ignore_until`: A dynamic timestamp used to discard hits during the initial cooldown.
- **`internal_ips`**: A registry of "Sender Fingerprints".
    - `ip`: The sender's last known IP.
    - `user_agent`: The sender's browser signature.
    - `last_seen`: Expiry check (usually 24h).

---

## 4. Backend / API Layer

**Primary File**: `api_bridge.py` (FastAPI)

### Request Lifecycle:
1.  **Middleware**: Every management request (Dashboard) triggers `register_sender_ip`, which updates the `internal_ips` table with the current user's IP and User-Agent.
2.  **Endpoint**: `GET /api/t/o/{tracking_id}.gif` captures the `request.client.host` and `User-Agent`.
3.  **Handoff**: These details are passed to `data/db.py:mark_opened`.
4.  **Broadcast**: If `mark_opened` returns a success code (`open`), a WebSocket event is broadcasted to update the Frontend UI in real-time.

---

## 5. The Known Issue: "Sent Folder" False Opens

Despite the 5-layer shield, certain "Sent folder" opens are still being recorded as real recipient opens.

### Root Cause Analysis:
The failure occurs primarily in **Same-Provider Scenarios** (e.g., a Gmail user sending to another Gmail user):
1.  **The Proxy Problem**: When the sender opens their Sent folder in Gmail, the `GoogleImageProxy` fetches the image.
2.  **The Mismatch Bypass**: Because the recipient is also a Gmail user, the "Proxy Mismatch" check (Layer 3) sees a Google Proxy hitting a Gmail address and assumes it is a legitimate recipient open.
3.  **The Fingerprint Gap**: Fingerprinting only works if the hit comes directly from the sender's IP. In a proxied environment (Gmail/Outlook web), the IP seen by the server is the **Proxy IP**, not the sender's IP, rendering Layer 2 useless.
4.  **The Burst Limitation**: If a sender opens only **one** specific email in their Sent folder (rather than scrolling), Layer 4 (Burst Detection) is not triggered.

---

## 6. Constraints

- **Preserve Real-Time Updates**: Tracking must remain responsive; do not introduce heavy processing that delays the `mark_opened` response.
- **No False Negatives**: It is better to have a rare false positive (sender open) than to miss a real recipient's open.
- **Sandbox Compatibility**: The solution must work in local development (localhost), via tunnels (ngrok), and in production.

---

## 7. Suggested Fix Direction

A professional-grade solution should focus on **Contextual Persistence**:

-   **Enhanced Fingerprinting**: Implement a "Sender Session Token" or a unique header that is only present when the sender is active in the dash. (Hard to do with pure images, but possible via IP correlation windows).
-   **Strict Provider Guard**: If Sender Provider == Proxy Provider == Recipient Provider, apply a significantly higher validation threshold (e.g., check for specific "Sender-only" browser headers that some mail clients leak even through proxies).
-   **Session Locking**: If the OMEGA Dashboard is currently open on an IP, and a Proxy hit from the same regional data center occurs for a campaign managed by that session, it should be treated with extreme suspicion.

---
**Note to Developer**: Please refer to `data/db.py` for all database query implementations and `api_bridge.py` for the FastAPI route configurations.
