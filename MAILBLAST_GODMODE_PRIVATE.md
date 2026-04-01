# MailBlast OMEGA — Private God Mode Specification
> **Personal Unrestricted Email Outreach Command Center**
> No limits. No rate caps. No restrictions. Full control. Built for one.

---

## ⚠️ PRIVATE VERSION — NOT FOR PUBLIC DISTRIBUTION
This spec is for the owner's personal installation only. Zero throttling, zero daily caps, full system access, no UI paywalls, no feature locks. Every capability is on by default.

---

## 1. PRODUCT OVERVIEW

**App name:** MailBlast OMEGA  
**Window title:** `OMEGA // Private Build`  
**Core concept:** A personal-use, no-holds-barred email outreach command center. Supports unlimited accounts, sends at maximum speed, includes full tracking infrastructure, AI-generated content, multi-account rotation, email warm-up, bypass tools, bulk operations, and a complete campaign intelligence dashboard — all running locally with no API bills.

**Philosophy:** This is a power tool for someone who knows what they're doing. No warnings, no confirmation dialogs (except destructive deletes), no artificial friction.

**Original codebase bugs:** All 7 bugs from the public spec are fixed here too (see Section 12).

---

## 2. TECH STACK

| Layer | Choice | Reason |
|---|---|---|
| UI | **CustomTkinter 5.2+** | Dark-native, modern widgets |
| Charting | **plotly** (embedded via `pywebview`) | Interactive, zoomable charts — far beyond matplotlib |
| Data | **pandas** + **openpyxl** + **csv** | Multi-format ingestion |
| Gmail | **google-auth-oauthlib** + **googleapiclient** | OAuth2 |
| Outlook | **msal** + **requests** | Microsoft Graph |
| IMAP/SMTP | **imaplib** + **smtplib** | Universal providers |
| Yahoo/Other | **smtplib** with app passwords | Extended provider coverage |
| AI Content | **openai** (GPT-4o) + **anthropic** (Claude) | Dual AI engines |
| Scheduling | **APScheduler** | Cron-style send scheduling |
| Tracking | **Flask** (local tracking server) + **sqlite3** | Open/click pixel tracking |
| Timezone | **pytz** + **timezonefinder** | Smart timezone detection |
| Browser preview | **pywebview** | Render HTML emails in real window |
| Proxy | **requests** + **socks** (PySocks) | Route tracking server through proxy |
| Security | **cryptography** (Fernet) | AES-256 encrypt stored credentials |
| Export | **reportlab** + **openpyxl** | PDF + Excel report export |
| Notifications | **plyer** | Desktop push notifications |
| Packaging | **PyInstaller** | Single executable |

### `requirements.txt`
```
customtkinter>=5.2.0
pandas>=2.0.0
openpyxl>=3.1.0
google-auth-oauthlib>=1.2.0
google-auth-httplib2>=0.1.0
google-api-python-client>=2.100.0
msal>=1.26.0
jinja2>=3.1.0
plotly>=5.18.0
pywebview>=4.4.0
openai>=1.10.0
anthropic>=0.18.0
APScheduler>=3.10.0
Flask>=3.0.0
Flask-Cors>=4.0.0
pytz>=2024.1
timezonefinder>=6.4.0
cryptography>=42.0.0
reportlab>=4.1.0
plyer>=2.1.0
requests>=2.31.0
PySocks>=1.7.1
Pillow>=10.2.0
python-dotenv>=1.0.0
```

---

## 3. DESIGN SYSTEM — "OMEGA DARK" THEME

> **Aesthetic:** Military-grade ops console. Think NSA dashboard meets Arc browser. Muted blacks, surgical cyan accents, data-dense but never cluttered. One accent color — electric cyan `#00E5FF` — everything else is grayscale. Power conveys itself through density and precision, not color.

### 3.1 Color Palette

```python
# Surfaces
BG_ROOT         = "#060608"   # Near-absolute black
BG_SIDEBAR      = "#0A0A0E"   # Sidebar
BG_PANEL        = "#0E0E14"   # Content panels
BG_CARD         = "#121218"   # Cards
BG_ELEVATED     = "#18181F"   # Elevated modals, dropdowns
BG_INPUT        = "#1C1C25"   # Input fields
BG_HOVER        = "#1E1E28"   # Hover
BG_SELECTED     = "#1A1A2E"   # Selected rows

# THE ONE ACCENT — Electric Cyan
ACCENT          = "#00E5FF"   # Primary action, highlights, live indicators
ACCENT_DIM      = "#00B4CC"   # Hover state of accent
ACCENT_GLOW     = "rgba(0, 229, 255, 0.12)"  # Glow bg for active elements

# Status
STATUS_SUCCESS  = "#00FF9D"   # Neon green — sent
STATUS_ERROR    = "#FF3B5C"   # Red — failed
STATUS_WARN     = "#FFB800"   # Amber — warning
STATUS_IDLE     = "#3A3A50"   # Gray — idle/inactive
STATUS_LIVE     = "#00E5FF"   # Cyan pulse — actively sending

# Provider colors (used in badges only)
GMAIL_COLOR     = "#EA4335"
OUTLOOK_COLOR   = "#0078D4"
IMAP_COLOR      = "#00FF9D"
YAHOO_COLOR     = "#6001D2"

# Text
TEXT_PRIMARY    = "#E8E8F0"   # Main text
TEXT_SECONDARY  = "#707088"   # Labels, metadata
TEXT_MUTED      = "#3A3A50"   # Disabled, placeholder
TEXT_ACCENT     = "#00E5FF"   # Links, active labels
TEXT_CODE       = "#A0FFA0"   # Monospace — green on black (classic terminal)

# Borders
BORDER          = "#1A1A28"   # Default
BORDER_ACCENT   = "#00E5FF"   # Focused / selected
BORDER_ERROR    = "#FF3B5C"
```

### 3.2 Typography

```python
FONT_DISPLAY  = ("JetBrains Mono", 22, "bold")   # Window title, big numbers
FONT_HEADING  = ("JetBrains Mono", 14, "bold")   # Section headers
FONT_SUBHEAD  = ("SF Pro Text",    12, "bold")   # Card titles
FONT_BODY     = ("SF Pro Text",    11, "normal") # Body
FONT_SMALL    = ("SF Pro Text",    9,  "normal") # Captions
FONT_CODE     = ("JetBrains Mono", 10, "normal") # Logs, email content, IDs
FONT_MONO_XS  = ("JetBrains Mono", 8,  "normal") # Timestamps

# Windows fallbacks
FONT_DISPLAY_WIN = ("Cascadia Code", 18, "bold")
FONT_CODE_WIN    = ("Cascadia Code", 10, "normal")
FONT_BODY_WIN    = ("Segoe UI",      11, "normal")
```

### 3.3 Special UI Patterns

#### Live Pulse Indicator
For actively sending campaigns — a small animated cyan dot:
```python
# Achieved via CTkLabel that alternates between ACCENT and STATUS_IDLE
# using root.after() at 800ms intervals
class PulseDot(CTkLabel):
    def __init__(self, parent):
        super().__init__(parent, text="●", font=("Arial", 10))
        self._pulse()
    def _pulse(self):
        current = self.cget("text_color")
        next_color = ACCENT if current == STATUS_IDLE else STATUS_IDLE
        self.configure(text_color=next_color)
        self.after(800, self._pulse)
```

#### Terminal Log Feed
All send events displayed in a monospace terminal-style scrollable text widget:
```
[14:32:01] → SENT     john@acme.com           (acme.com)
[14:32:04] → SENT     hello@startup.io        (startup.io)
[14:32:07] ✗ FAILED   bad@domain              reason: SMTP 550
[14:32:09] → SENT     ceo@bigcorp.com         (bigcorp.com)
[14:32:09]   OPENED   john@acme.com           (2m after send) ★
```
Color-coded: cyan = sent, green = opened, red = failed, amber = bounced.

---

## 4. APPLICATION ARCHITECTURE

### 4.1 File Structure

```
mailblast-omega/
├── main.py
├── app.py
├── requirements.txt
├── .env                        # AI API keys, tracking server config
├── credentials/
│   ├── gmail_credentials.json
│   ├── outlook_credentials.json
│   └── tokens/                 # Per-account token files
│       ├── gmail_user1.json
│       └── outlook_user1.json
├── database/
│   └── omega.db                # Master SQLite database
├── tracking/
│   ├── server.py               # Flask tracking pixel server
│   ├── pixel.py                # Pixel URL generator
│   └── processor.py            # Open/click event processor
├── assets/
│   ├── icons/
│   └── sounds/                 # Notification sounds (optional)
├── templates/                  # Saved email templates (JSON)
├── exports/                    # Generated PDF/Excel reports
├── ui/
│   ├── sidebar.py
│   ├── dashboard.py
│   ├── composer.py             # Full-featured compose tab
│   ├── accounts.py
│   ├── campaigns.py
│   ├── scheduler.py            # Schedule manager tab
│   ├── analytics.py
│   ├── ai_studio.py            # AI content generation tab
│   ├── warmup.py               # Account warm-up tab
│   ├── blacklist.py            # Global bounce/unsubscribe list
│   ├── settings.py
│   └── widgets/
│       ├── pulse_dot.py
│       ├── terminal_log.py
│       ├── stat_card.py
│       ├── progress_ring.py
│       └── variable_editor.py  # Dynamic variable UI component
├── core/
│   ├── gmail_client.py
│   ├── outlook_client.py
│   ├── imap_client.py
│   ├── yahoo_client.py         # Yahoo/AOL via app passwords
│   ├── sender.py               # Unified sender (no limits)
│   ├── rotation_manager.py     # Multi-account round-robin
│   ├── template_engine.py      # Full Jinja2 + custom filters
│   ├── variable_manager.py     # Dynamic variable registry
│   ├── scheduler_engine.py     # APScheduler wrapper
│   ├── open_tracker.py         # Tracking pixel injection + events
│   ├── warmup_engine.py        # Account warm-up sequences
│   ├── ai_generator.py         # GPT-4o + Claude dual engine
│   ├── bounce_handler.py       # IMAP bounce detection
│   ├── blacklist_manager.py    # Global suppression list
│   └── credential_vault.py     # Fernet-encrypted credential store
├── data/
│   ├── db.py
│   └── loader.py               # Excel/CSV/Google Sheets loader
└── utils/
    ├── logger.py
    ├── timezone_utils.py       # Smart timezone detection
    └── export_engine.py        # PDF + Excel report generator
```

### 4.2 Full Database Schema

```sql
-- Accounts
CREATE TABLE accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    provider        TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    display_name    TEXT,
    token_path      TEXT,
    imap_host       TEXT,
    imap_port       INTEGER DEFAULT 993,
    smtp_host       TEXT,
    smtp_port       INTEGER DEFAULT 587,
    smtp_security   TEXT DEFAULT 'STARTTLS',
    username        TEXT,
    encrypted_pass  TEXT,           -- Fernet encrypted
    daily_limit     INTEGER DEFAULT 0,  -- 0 = unlimited
    warmup_mode     INTEGER DEFAULT 0,
    warmup_day      INTEGER DEFAULT 0,
    total_sent      INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 100,
    is_active       INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE campaigns (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    account_ids     TEXT,           -- JSON array of account IDs (rotation)
    rotation_mode   TEXT DEFAULT 'single',  -- single | round_robin | random
    subject         TEXT,
    body_plain      TEXT,
    body_html       TEXT,
    use_html        INTEGER DEFAULT 0,
    tracking_enabled INTEGER DEFAULT 1,
    click_tracking  INTEGER DEFAULT 1,
    status          TEXT DEFAULT 'draft',
    total           INTEGER DEFAULT 0,
    sent            INTEGER DEFAULT 0,
    failed          INTEGER DEFAULT 0,
    opened          INTEGER DEFAULT 0,
    clicked         INTEGER DEFAULT 0,
    bounced         INTEGER DEFAULT 0,
    unsubscribed    INTEGER DEFAULT 0,
    scheduled_at    TEXT,           -- ISO datetime if scheduled
    timezone        TEXT,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    started_at      TEXT,
    finished_at     TEXT
);

-- Per-email send log
CREATE TABLE send_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id     INTEGER REFERENCES campaigns(id),
    account_id      INTEGER REFERENCES accounts(id),
    recipient       TEXT NOT NULL,
    website         TEXT,
    row_data        TEXT,           -- full JSON of the Excel row
    status          TEXT,
    error_msg       TEXT,
    tracking_id     TEXT UNIQUE,    -- UUID for open tracking
    opened          INTEGER DEFAULT 0,
    open_count      INTEGER DEFAULT 0,
    first_opened_at TEXT,
    last_opened_at  TEXT,
    clicked         INTEGER DEFAULT 0,
    click_count     INTEGER DEFAULT 0,
    bounced         INTEGER DEFAULT 0,
    sent_at         TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tracking events (pixel hits)
CREATE TABLE tracking_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_id TEXT REFERENCES send_log(tracking_id),
    event_type  TEXT,               -- 'open' | 'click'
    ip_address  TEXT,
    user_agent  TEXT,
    url_clicked TEXT,               -- for click events
    occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled jobs
CREATE TABLE scheduled_jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id     INTEGER REFERENCES campaigns(id),
    scheduled_at    TEXT NOT NULL,  -- ISO datetime UTC
    timezone        TEXT,
    local_time      TEXT,           -- display time in target tz
    status          TEXT DEFAULT 'pending',  -- pending | running | done | cancelled
    apscheduler_id  TEXT UNIQUE,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Saved templates
CREATE TABLE templates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    subject     TEXT,
    body_plain  TEXT,
    body_html   TEXT,
    variables   TEXT,               -- JSON list of variable names found
    use_html    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT
);

-- Global blacklist / suppression
CREATE TABLE blacklist (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT UNIQUE NOT NULL,
    reason      TEXT,               -- 'bounced' | 'unsubscribed' | 'manual'
    added_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Custom variable definitions
CREATE TABLE variable_definitions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT UNIQUE NOT NULL,   -- e.g. "FirstName"
    description TEXT,
    default_val TEXT,
    column_hint TEXT,                   -- suggested Excel column name
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- AI generation history
CREATE TABLE ai_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    engine      TEXT,               -- 'gpt4o' | 'claude'
    prompt      TEXT,
    output      TEXT,
    tokens_used INTEGER,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Account warm-up log
CREATE TABLE warmup_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id  INTEGER REFERENCES accounts(id),
    day_number  INTEGER,
    emails_sent INTEGER,
    target      INTEGER,
    success_rate REAL,
    date        TEXT DEFAULT CURRENT_DATE
);
```

---

## 5. UI LAYOUT — FULL SPECIFICATION

### 5.1 Main Window

**Dimensions:** 1400×900px minimum, resizable, fullscreen supported  
**Title bar:** Frameless custom (`overrideredirect=True`)  
**Left edge:** Thin 2px vertical bar in `ACCENT` color  

```
┌──┬────────┬─────────────────────────────────────────────────────────┐
│  │        │  TOPBAR: campaign name + live status + [Pause][Stop]    │
│  │        ├─────────────────────────────────────────────────────────┤
│  │ SIDE   │                                                         │
│2 │ BAR    │                  CONTENT AREA                          │
│px│ 240px  │                                                         │
│  │        │                                                         │
│  │        │                                                         │
└──┴────────┴─────────────────────────────────────────────────────────┘
```

### 5.2 Sidebar

**Nav items (all tabs available, no locks):**
```
⚡ OMEGA
   Private Build

─────────────────
⬡  Dashboard
✉  Compose
⟳  Rotation
📅 Scheduler
🤖 AI Studio
📊 Analytics
🔥 Warm-Up
📬 Accounts
◻  Templates
⛔ Blacklist
⚙  Settings
─────────────────
[Active accounts list — all shown]
```

---

### 5.3 Dashboard

**Top bar:** Global send counter (lifetime), active campaigns, accounts online, open rate across all time.

**Live Feed Panel (right 40%):**
Real-time terminal log — all send/open/click events as they happen. Auto-scrolls. Monospace green-on-black. Can be paused with spacebar.

**Left panels:**
- Active campaigns widget (all running, with live progress rings)
- Scheduled next-send widget
- Account health scores (reputation meter per account)
- Today's stats: sent, opened, clicked, failed

**Quick Actions row:**
```
[▶ Start Last Campaign]  [+ New Campaign]  [📋 Import Contacts]  [🤖 Generate Copy]
```

---

### 5.4 Compose Tab

#### Layout: 4 columns

**Col 1 — Campaign Config (260px)**
```
Campaign Name
[___________________________]

From Account(s)
[▾ All Active Accounts     ]  ← multi-select
  [●] Gmail user1@gmail.com
  [●] Outlook biz@outlook.com
  [○] IMAP me@company.com

Rotation Mode
(●) Single account
(○) Round-robin
(○) Random

Upload Contacts
[📁 Drop file here or browse]
  Accepted: .xlsx .xls .csv
  ✓ 1,200 contacts from leads.xlsx
  ✓ 8 extra columns detected as variables

Send Speed
[●────────────────────] MAX
[Custom: ___ to ___ sec]
[⚠ No limits enforced]

Daily Cap Per Account
[0 = Unlimited        ]

Retry Failed
[ON ●] up to [5] attempts
```

**Col 2 — Subject + Body (flex)**
```
Subject
[{Company} — Quick question about {Industry}     ]

Variables detected: {Company} {Industry}

── Mode ──────────────────────────────
[Plain Text]  [HTML]  [AI-Generated]

Body Editor
┌──────────────────────────────────────────┐
│ Hi {FirstName},                           │
│                                           │
│ I came across {Website} and noticed       │
│ you're doing great work in {Industry}.    │
│                                           │
│ I'd love to chat about {Offer}.          │
│                                           │
│ Best,                                     │
│ {SenderName}                              │
│ {SenderTitle}                             │
└──────────────────────────────────────────┘

[Insert Variable ▾]  [AI Rewrite ✨]  [Spintax ↻]
```

**Col 3 — Variable Manager (220px)**

Dynamic, auto-populated from the loaded Excel columns PLUS manually-added variables:

```
VARIABLES
─────────────────────────
Column Variables (auto):
  {Website}      → Column A
  {Company}      → Column B
  {FirstName}    → Column C
  {Industry}     → Column D
  {Offer}        → Column E
  {Phone}        → Column F

System Variables (always):
  {SenderName}   → account name
  {SenderEmail}  → sending address
  {Date}         → today's date
  {Time}         → current time
  {UnsubLink}    → unsubscribe URL

Custom Variables:
  {MyOffer}      → "Check out our tool"
  [+ Add Custom]

[Edit Defaults]  [Export Variable Map]
```

**Variable Manager — "Add Custom Variable" modal:**
```
Variable Name:  [{________}]
Default Value:  [___________]
Description:    [___________]
[Save]
```

**Col 4 — Live Preview (260px)**
```
PREVIEW — Row 1 of 1,200
[◀ Prev]  1  [Next ▶]

To:   john@acme.com
From: You <user@gmail.com>
Sub:  Acme Corp — Quick question about SaaS

───────────────────────────────
Hi John,

I came across acmecorp.com and
noticed you're doing great work
in SaaS. I'd love to chat about
Check out our tool.

Best,
Abdullah
Founder
───────────────────────────────
[Open Full Preview]
```

**Bottom action bar:**
```
[💾 Save Template]  [🧪 Test Send to Me]  [📅 Schedule]  [▶▶ SEND ALL NOW]
```

---

### 5.5 Rotation Manager Tab

Manage multi-account sending rotation for volume and deliverability:

```
ACCOUNT ROTATION SETUP
─────────────────────────────────────────────────────
 Account                  Weight   Daily Cap   Status
 ─────────────────────────────────────────────────────
 [●] user@gmail.com        40%     Unlimited   🟢 Active
 [●] biz@outlook.com       35%     Unlimited   🟢 Active
 [●] me@company.com        25%     Unlimited   🟢 Active

Rotation Strategy
  (●) Round-Robin (1 email per account in sequence)
  (○) Weighted Random (respects percentages above)
  (○) Parallel (all accounts send simultaneously)

[Test Rotation Logic]  [Save Configuration]
```

---

### 5.6 Scheduler Tab (`scheduler.py`)

Full scheduled send with timezone intelligence:

#### New Schedule Form
```
Campaign:  [▾ Select campaign              ]

Send Date: [2025-03-01]   Time: [09:00 AM]

Target Timezone:
  (●) Auto-detect from recipient domain
  (○) Fixed timezone: [▾ America/New_York  ]
  (○) Send in my local timezone

Preview:
  Target timezone: America/New_York (UTC-5)
  Will send at: 09:00 AM EST = 14:00 UTC
  Your local time when it sends: 5:00 PM (PKT)

Repeat:
  (●) One-time
  (○) Daily at same time
  (○) Weekly: [Mon] [Tue] [Wed] [Thu] [Fri]
  (○) Custom cron: [__________]

[Schedule Campaign]
```

#### Scheduled Jobs Table
```
 ID   CAMPAIGN           ACCOUNT         SCHEDULED AT          STATUS     ACTION
 ─────────────────────────────────────────────────────────────────────────────────
 #12  Q1 Outreach        user@gmail.com  Mar 1, 09:00 EST       ⏰Pending  [Cancel]
 #11  Product Launch     rotation        Mar 3, 09:00 PST       ⏰Pending  [Cancel]
 #10  Follow-Up Batch    biz@outlook     Feb 28, 08:00 GST     ✅ Done     [Clone]
```

#### Timezone Auto-Detection Logic
```python
from timezonefinder import TimezoneFinder
import pytz
from datetime import datetime
import socket

def detect_timezone_from_domain(domain: str) -> str:
    """
    Attempts to guess recipient timezone from domain TLD/geo:
    .pk → Asia/Karachi
    .uk → Europe/London
    .au → Australia/Sydney
    .de → Europe/Berlin
    etc.
    Falls back to whois/IP lookup if TLD is .com/.net/.org
    """
    TLD_TIMEZONE_MAP = {
        "pk": "Asia/Karachi",
        "uk": "Europe/London",
        "gb": "Europe/London",
        "de": "Europe/Berlin",
        "fr": "Europe/Paris",
        "au": "Australia/Sydney",
        "ca": "America/Toronto",
        "in": "Asia/Kolkata",
        "ae": "Asia/Dubai",
        "sa": "Asia/Riyadh",
        "jp": "Asia/Tokyo",
        "br": "America/Sao_Paulo",
        "mx": "America/Mexico_City",
        "sg": "Asia/Singapore",
        "za": "Africa/Johannesburg",
        "ng": "Africa/Lagos",
        "eg": "Africa/Cairo",
        "us": "America/New_York",   # default US
        "com": "America/New_York",  # default fallback
    }
    tld = domain.rsplit(".", 1)[-1].lower()
    return TLD_TIMEZONE_MAP.get(tld, "UTC")

def schedule_for_9am(domain: str) -> datetime:
    """Returns UTC datetime for 9:00 AM in recipient's detected timezone."""
    tz_name = detect_timezone_from_domain(domain)
    tz = pytz.timezone(tz_name)
    local_9am = tz.localize(datetime.now(tz).replace(hour=9, minute=0, second=0, microsecond=0))
    # If 9am today already passed, schedule for tomorrow
    now_local = datetime.now(tz)
    if local_9am <= now_local:
        from datetime import timedelta
        local_9am += timedelta(days=1)
    return local_9am.astimezone(pytz.utc)
```

#### APScheduler Setup
```python
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler(timezone="UTC")
scheduler.start()

def add_scheduled_campaign(campaign_id: int, run_at_utc: datetime, repeat: str = "once"):
    if repeat == "once":
        trigger = DateTrigger(run_date=run_at_utc)
    elif repeat == "daily":
        trigger = CronTrigger(hour=run_at_utc.hour, minute=run_at_utc.minute)
    elif repeat == "weekdays":
        trigger = CronTrigger(day_of_week="mon-fri",
                              hour=run_at_utc.hour, minute=run_at_utc.minute)
    
    job = scheduler.add_job(
        func=run_campaign,
        trigger=trigger,
        args=[campaign_id],
        id=f"campaign_{campaign_id}_{int(run_at_utc.timestamp())}",
        misfire_grace_time=300
    )
    return job.id
```

---

### 5.7 AI Studio Tab (`ai_studio.py`)

Full dual-engine AI content generation. No usage limits enforced in UI.

#### Layout: 2 columns

**Left — Generation Controls**
```
AI ENGINE
  (●) GPT-4o (OpenAI)
  (○) Claude 3.5 Sonnet (Anthropic)
  (○) Auto (GPT-4o → fallback Claude)

PROMPT MODE
  (●) Smart Brief  ← describe context, AI writes full email
  (○) Rewrite      ← paste draft, AI improves it
  (○) Subject Lines ← generate 10 subject line variants
  (○) Follow-Up    ← generate follow-up for a campaign
  (○) Full Sequence ← generate 3-email cold sequence

BRIEF (for Smart Brief mode)
┌───────────────────────────────────┐
│ Product/Service:                  │
│ [___________________________]     │
│                                   │
│ Target audience:                  │
│ [___________________________]     │
│                                   │
│ Tone: [Professional ▾]            │
│ Length: [Medium ▾]                │
│ CTA: [Book a call ▾]              │
│                                   │
│ Include variables:                │
│ [●] {FirstName}  [●] {Company}    │
│ [●] {Website}    [○] {Industry}   │
└───────────────────────────────────┘

[✨ Generate]   [🎲 Regenerate]

Variants: [1] [3] [5]
```

**Right — Output**
```
GENERATED OUTPUT
─────────────────────────────────────
Subject: Quick question, {FirstName}

Body:
Hi {FirstName},

I was looking at {Website} and noticed
{Company} is doing impressive work in
{Industry}...

[Tokens used: 347]  [Cost: ~$0.003]
─────────────────────────────────────
[Use as Template]  [Copy]  [Edit Live]

── VARIANTS ──────────────────────────
[Variant 1 ▾]   [Variant 2 ▾]   [Variant 3 ▾]

── HISTORY ───────────────────────────
[Last 10 generations, clickable]
```

#### AI Generator Core (`core/ai_generator.py`)

```python
import openai
import anthropic

class AIGenerator:
    def __init__(self, openai_key: str, anthropic_key: str):
        self.oai = openai.OpenAI(api_key=openai_key)
        self.ant = anthropic.Anthropic(api_key=anthropic_key)

    def generate(self, brief: dict, engine: str = "gpt4o",
                 mode: str = "email", variants: int = 1) -> list[dict]:
        """
        Returns list of {subject, body, tokens_used} dicts.
        """
        prompt = self._build_prompt(brief, mode)
        results = []
        
        for i in range(variants):
            if engine == "gpt4o":
                result = self._generate_openai(prompt)
            elif engine == "claude":
                result = self._generate_claude(prompt)
            else:  # auto: try openai first, fallback
                try:
                    result = self._generate_openai(prompt)
                except:
                    result = self._generate_claude(prompt)
            results.append(result)
        
        return results

    def _generate_openai(self, prompt: str) -> dict:
        resp = self.oai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert cold email copywriter. Output ONLY JSON: {\"subject\": \"...\", \"body\": \"...\"}"},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.85
        )
        import json
        data = json.loads(resp.choices[0].message.content)
        data["tokens_used"] = resp.usage.total_tokens
        data["engine"] = "gpt-4o"
        return data

    def _generate_claude(self, prompt: str) -> dict:
        resp = self.ant.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
            system='You are an expert cold email copywriter. Output ONLY valid JSON: {"subject": "...", "body": "..."}'
        )
        import json
        data = json.loads(resp.content[0].text)
        data["tokens_used"] = resp.usage.input_tokens + resp.usage.output_tokens
        data["engine"] = "claude"
        return data

    def generate_sequence(self, brief: dict, num_emails: int = 3, engine: str = "gpt4o") -> list:
        """Generate a multi-email cold outreach sequence."""
        prompt = f"""
        Create a {num_emails}-email cold outreach sequence for:
        Product: {brief.get('product')}
        Target: {brief.get('audience')}
        Tone: {brief.get('tone', 'professional')}
        
        Email 1: Initial outreach
        Email 2: Follow-up (3 days later)
        Email 3: Break-up email (7 days later)
        
        Use these variables: {{FirstName}}, {{Company}}, {{Website}}
        
        Return JSON array: [{{"subject": "...", "body": "...", "send_day": 0}}, ...]
        """
        # ... similar implementation
    
    def rewrite(self, draft: str, instruction: str, engine: str = "gpt4o") -> dict:
        """Rewrite an existing draft with instruction."""
        prompt = f"Rewrite this email: {instruction}\n\n---\n{draft}\n---\nReturn JSON: {{\"subject\": \"...\", \"body\": \"...\"}}"
        if engine == "gpt4o":
            return self._generate_openai(prompt)
        return self._generate_claude(prompt)

    def generate_subjects(self, context: str, count: int = 10, engine: str = "gpt4o") -> list:
        """Generate subject line variants."""
        prompt = f"Generate {count} cold email subject lines for: {context}\nReturn JSON array of strings."
        # ... implementation

    def _build_prompt(self, brief: dict, mode: str) -> str:
        return f"""
        Write a cold outreach email with these details:
        - Product/Service: {brief.get('product', 'our product')}
        - Target audience: {brief.get('audience', 'business owners')}
        - Tone: {brief.get('tone', 'professional but friendly')}
        - Length: {brief.get('length', 'medium (150-200 words)')}
        - CTA: {brief.get('cta', 'schedule a quick call')}
        
        IMPORTANT: Use these variables naturally in the email:
        {{FirstName}}, {{Company}}, {{Website}}
        
        Make it feel personal and non-spammy. No "I hope this email finds you well".
        Return as JSON: {{"subject": "...", "body": "..."}}
        """
```

---

### 5.8 Email Open Tracking (`tracking/`)

Full pixel tracking system running on a local Flask server, exposed via ngrok or a cheap VPS.

#### Architecture
```
Email sent with <img src="http://your-tracker.com/p/{tracking_id}.png">
                                    ↓
                         Recipient opens email
                                    ↓
                         Email client loads the 1px image
                                    ↓
                Flask server receives GET request
                                    ↓
                Logs: tracking_id, IP, user-agent, timestamp
                                    ↓
                Updates send_log in omega.db
                                    ↓
                Returns 1x1 transparent GIF (instant)
                                    ↓
                Desktop notification: "John @ Acme opened your email ★"
```

#### Tracking Server (`tracking/server.py`)
```python
from flask import Flask, send_file, request
from flask_cors import CORS
import sqlite3
import io
import uuid
from datetime import datetime
from plyer import notification

app = Flask(__name__)
CORS(app)

# 1x1 transparent GIF in memory
PIXEL_GIF = bytes([
    0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,
    0x80,0x00,0x00,0xff,0xff,0xff,0x00,0x00,0x00,0x21,
    0xf9,0x04,0x00,0x00,0x00,0x00,0x00,0x2c,0x00,0x00,
    0x00,0x00,0x01,0x00,0x01,0x00,0x00,0x02,0x02,0x44,
    0x01,0x00,0x3b
])

@app.route("/p/<tracking_id>.gif")
def track_open(tracking_id):
    # Log the open event
    conn = sqlite3.connect("database/omega.db")
    cursor = conn.cursor()
    
    # Get send log entry
    cursor.execute("SELECT id, recipient, website, open_count FROM send_log WHERE tracking_id=?",
                   (tracking_id,))
    row = cursor.fetchone()
    
    if row:
        log_id, recipient, website, open_count = row
        now = datetime.utcnow().isoformat()
        
        # Update send_log
        cursor.execute("""
            UPDATE send_log 
            SET opened=1, open_count=open_count+1, last_opened_at=?
              , first_opened_at=COALESCE(first_opened_at, ?)
            WHERE tracking_id=?
        """, (now, now, tracking_id))
        
        # Insert tracking event
        cursor.execute("""
            INSERT INTO tracking_events (tracking_id, event_type, ip_address, user_agent)
            VALUES (?, 'open', ?, ?)
        """, (tracking_id, request.remote_addr, request.user_agent.string))
        
        conn.commit()
        
        # Desktop notification for first open only
        if open_count == 0:
            notification.notify(
                title="📬 Email Opened!",
                message=f"{recipient} just opened your email ({website})",
                timeout=8
            )
    
    conn.close()
    return send_file(
        io.BytesIO(PIXEL_GIF),
        mimetype="image/gif",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )

@app.route("/c/<tracking_id>")
def track_click(tracking_id):
    """Click tracking — redirect to destination URL."""
    dest_url = request.args.get("url", "https://google.com")
    # Log click event (same pattern as above)
    # ...
    from flask import redirect
    return redirect(dest_url)

def start_tracking_server(port: int = 5500):
    """Starts Flask server in a background thread."""
    import threading
    t = threading.Thread(target=lambda: app.run(port=port, debug=False), daemon=True)
    t.start()
    return f"http://localhost:{port}"
```

#### Pixel Injection (`tracking/pixel.py`)
```python
import uuid

def inject_tracking_pixel(body_html: str, tracking_id: str, server_url: str) -> str:
    """Appends a 1px tracking pixel to the HTML email body."""
    pixel_url = f"{server_url}/p/{tracking_id}.gif"
    pixel_tag = f'<img src="{pixel_url}" width="1" height="1" alt="" style="display:none!important;"/>'
    
    # Insert before </body> if present, otherwise append
    if "</body>" in body_html.lower():
        body_html = body_html.replace("</body>", f"{pixel_tag}</body>")
    else:
        body_html += pixel_tag
    
    return body_html

def inject_click_tracking(body_html: str, tracking_id: str, server_url: str) -> str:
    """Wraps all <a href> links with click tracker."""
    import re
    def replace_link(match):
        original_url = match.group(1)
        if "unsubscribe" in original_url.lower():
            return match.group(0)  # Don't track unsubscribe links
        tracked = f"{server_url}/c/{tracking_id}?url={original_url}"
        return f'href="{tracked}"'
    
    return re.sub(r'href="(https?://[^"]+)"', replace_link, body_html)

def generate_tracking_id() -> str:
    return str(uuid.uuid4()).replace("-", "")
```

#### Making the Tracker Public (2 options)

**Option A — ngrok (simplest, free):**
```bash
# In terminal, run alongside the app:
ngrok http 5500
# Copy the https://xxxx.ngrok.io URL → paste in Settings → Tracking Server URL
```

**Option B — Tiny VPS ($3/mo at DigitalOcean/Hetzner):**
```python
# Deploy tracking/server.py on a $3/mo VPS
# Point a domain: track.yourdomain.com → VPS IP
# Set in Settings: Tracking Server URL = https://track.yourdomain.com
```

---

### 5.9 Warm-Up Engine (`core/warmup_engine.py`)

Gradually increases send volume to build account reputation. Fully automated.

```python
WARMUP_SCHEDULE = {
    # day: emails_to_send
    1:  5,   2:  8,   3:  12,  4:  18,  5:  25,
    6:  35,  7:  48,  8:  65,  9:  85,  10: 110,
    11: 140, 12: 175, 13: 215, 14: 260, 15: 310,
    16: 365, 17: 425, 18: 490, 19: 560, 20: 635,
    21: 715, 22: 800, 23: 890, 24: 985, 25: 1000,  # max
}

class WarmUpEngine:
    """
    Sends warm-up emails to a seed list (internal addresses or
    a warm-up service like Mailreach/Lemwarm seed addresses).
    
    Each warm-up email is sent AND auto-replied to (from seed addresses)
    to signal positive engagement to ESP algorithms.
    """
    def __init__(self, account, db, seed_list: list[str]):
        self.account = account
        self.db = db
        self.seed_list = seed_list

    def get_today_target(self, account_id: int) -> int:
        warmup_day = self.db.get_warmup_day(account_id)
        return WARMUP_SCHEDULE.get(warmup_day, 1000)

    def run_daily_warmup(self, account_id: int):
        target = self.get_today_target(account_id)
        sent = 0
        for i in range(target):
            seed_email = self.seed_list[i % len(self.seed_list)]
            # Send warm-up email with random subject/body
            subject = self._random_subject()
            body = self._random_body()
            result = self.account.send_email(seed_email, subject, body)
            if result["status"] == "sent":
                sent += 1
            time.sleep(random.uniform(30, 120))  # slow pace for warm-up
        
        self.db.log_warmup(account_id, sent, target)
        self.db.increment_warmup_day(account_id)
        return sent

    def _random_subject(self) -> str:
        subjects = [
            "Quick catch-up", "Following up", "Hey there",
            "Check this out", "FYI", "Thoughts?", "Re: our chat"
        ]
        return random.choice(subjects)

    def _random_body(self) -> str:
        # Random human-like short email content
        ...
```

---

### 5.10 Bounce Handler (`core/bounce_handler.py`)

Reads bounced emails from the INBOX via IMAP and auto-adds them to the blacklist.

```python
import imaplib
import email as email_lib
import re

class BounceHandler:
    def __init__(self, imap_config: dict, db):
        self.config = imap_config
        self.db = db

    def scan_bounces(self) -> int:
        """
        Connects to IMAP, scans for bounce/NDR emails,
        extracts failed addresses, adds to blacklist.
        Returns count of new bounces found.
        """
        bounces_found = 0
        
        with imaplib.IMAP4_SSL(self.config["imap_host"], self.config["imap_port"]) as mail:
            mail.login(self.config["username"], self._get_password())
            mail.select("INBOX")
            
            # Search for delivery failure messages
            _, message_nums = mail.search(None,
                '(OR SUBJECT "Mail delivery failed" SUBJECT "Delivery Status Notification" '
                'SUBJECT "Undeliverable" SUBJECT "failure notice" FROM "mailer-daemon")'
            )
            
            for num in message_nums[0].split():
                _, msg_data = mail.fetch(num, "(RFC822)")
                raw = msg_data[0][1]
                msg = email_lib.message_from_bytes(raw)
                
                # Extract failed address from bounce body
                body = self._get_body(msg)
                failed_emails = self._extract_failed_addresses(body)
                
                for failed_email in failed_emails:
                    self.db.add_to_blacklist(failed_email, reason="bounced")
                    bounces_found += 1
        
        return bounces_found

    def _extract_failed_addresses(self, text: str) -> list[str]:
        EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
        # Look near bounce indicators
        bounce_patterns = [
            r"(?:failed|undeliverable|unknown user)[^\n]*?(" + EMAIL_RE.pattern + r")",
            r"To:\s*(" + EMAIL_RE.pattern + r")",
            r"Original-Recipient:[^\n]*?(" + EMAIL_RE.pattern + r")",
        ]
        found = set()
        for pattern in bounce_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            found.update(matches)
        return list(found)
```

---

### 5.11 Spintax Support (`core/template_engine.py` — extended)

```python
import re, random

def process_spintax(text: str) -> str:
    """
    Processes {option1|option2|option3} spintax.
    Example: "Hi {there|friend|{FirstName}}!" → "Hi there!" (random pick)
    Supports nested spintax.
    """
    def spin(match):
        options = match.group(1).split("|")
        return random.choice(options)
    
    # Process inner-most first (repeat until no more spintax)
    while re.search(r'\{([^{}]+\|[^{}]+)\}', text):
        text = re.sub(r'\{([^{}]+\|[^{}]+)\}', spin, text)
    
    return text
```

**Usage in composer:** `{Hi there|Hello|Hey}` randomizes per recipient for inbox variety.

---

### 5.12 Export Engine (`utils/export_engine.py`)

```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
import openpyxl

class ExportEngine:
    def export_campaign_pdf(self, campaign_id: int, output_path: str):
        """Generates a detailed campaign report PDF."""
        # Campaign summary, per-email log table, open stats
        ...

    def export_campaign_excel(self, campaign_id: int, output_path: str):
        """Exports full send log to Excel with formatting."""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Campaign Log"
        headers = ["Recipient", "Website", "Status", "Opened", "Open Count",
                   "First Opened", "Sent At", "Error"]
        ws.append(headers)
        # Fetch and write send_log rows
        ...
        wb.save(output_path)
```

---

### 5.13 Unsubscribe Handler

Every HTML email has an unsubscribe link that hits the tracking server:

```python
# In pixel.py
def get_unsub_link(tracking_id: str, server_url: str) -> str:
    return f"{server_url}/unsub/{tracking_id}"

# In tracking/server.py
@app.route("/unsub/<tracking_id>")
def unsubscribe(tracking_id):
    # Add to blacklist
    # Show "You've been unsubscribed" page
    conn = sqlite3.connect("database/omega.db")
    cursor = conn.cursor()
    cursor.execute("SELECT recipient FROM send_log WHERE tracking_id=?", (tracking_id,))
    row = cursor.fetchone()
    if row:
        cursor.execute("INSERT OR IGNORE INTO blacklist (email, reason) VALUES (?, 'unsubscribed')", 
                       (row[0], ))
        conn.commit()
    conn.close()
    return "<h2>You've been unsubscribed. You won't receive further emails.</h2>"
```

---

## 6. NO-LIMIT SENDER (`core/sender.py`)

```python
import threading, time, random

class OmegaSender:
    """
    Unrestricted sender. No rate cap. No daily limit.
    Sends as fast as the SMTP server allows.
    Optional: minimal delay to avoid SMTP connection errors.
    """
    def __init__(self, clients: list, campaign_id: int, df,
                 subject: str, body: str, use_html: bool,
                 tracking_enabled: bool, tracking_server_url: str,
                 rotation_mode: str, stop_event: threading.Event,
                 db, on_progress, on_complete,
                 min_delay: float = 0.0, max_delay: float = 0.0):
        self.clients = clients
        self.campaign_id = campaign_id
        self.df = df
        self.subject = subject
        self.body = body
        self.use_html = use_html
        self.tracking_enabled = tracking_enabled
        self.tracking_server_url = tracking_server_url
        self.rotation_mode = rotation_mode
        self.stop_event = stop_event
        self.db = db
        self.on_progress = on_progress
        self.on_complete = on_complete
        self.min_delay = min_delay  # default 0 — no delay
        self.max_delay = max_delay
        self._client_index = 0

    def run(self):
        total = len(self.df)
        sent = 0
        failed = 0

        # Pre-filter blacklisted emails
        blacklist = self.db.get_blacklist_set()
        
        for idx, row in self.df.iterrows():
            if self.stop_event.is_set():
                break

            website = str(row.get("Website", ""))
            emails_raw = str(row.get("Emails", ""))
            emails = self._parse_emails(emails_raw)

            for email in emails:
                if self.stop_event.is_set():
                    break
                
                # Skip blacklisted
                if email.lower() in blacklist:
                    self.db.log_send(self.campaign_id, None, email, website,
                                     "skipped", "Blacklisted")
                    continue

                client = self._get_next_client()
                tracking_id = None
                
                # Render variables
                context = {col: str(row.get(col, "")) for col in self.df.columns}
                from core.template_engine import render_template, process_spintax
                rendered_subject = process_spintax(render_template(self.subject, context))
                rendered_body    = process_spintax(render_template(self.body, context))

                # Inject tracking
                if self.tracking_enabled and self.use_html:
                    from tracking.pixel import generate_tracking_id, inject_tracking_pixel, inject_click_tracking, get_unsub_link
                    tracking_id = generate_tracking_id()
                    rendered_body = inject_tracking_pixel(rendered_body, tracking_id, self.tracking_server_url)
                    rendered_body = inject_click_tracking(rendered_body, tracking_id, self.tracking_server_url)
                    unsub_link = get_unsub_link(tracking_id, self.tracking_server_url)
                    rendered_body = rendered_body.replace("{UnsubLink}", unsub_link)

                # Send
                result = client.send_email(email, rendered_subject, rendered_body, html=self.use_html)
                self.db.log_send(self.campaign_id, client.account_id, email,
                                 website, result["status"], result.get("error"), tracking_id)

                if result["status"] == "sent":
                    sent += 1
                else:
                    failed += 1
                    self.db.add_to_blacklist(email, "hard_bounce") if "550" in str(result.get("error","")) else None

                self.on_progress(sent, failed, total, email, result["status"])

                # Optional minimal delay (default 0)
                if self.max_delay > 0:
                    time.sleep(random.uniform(self.min_delay, self.max_delay))

        self.on_complete(sent, failed, total)

    def _get_next_client(self):
        """Returns next client based on rotation mode."""
        if len(self.clients) == 1:
            return self.clients[0]
        if self.rotation_mode == "round_robin":
            client = self.clients[self._client_index % len(self.clients)]
            self._client_index += 1
            return client
        elif self.rotation_mode == "random":
            return random.choice(self.clients)
        return self.clients[0]

    def _parse_emails(self, raw: str) -> list:
        import re
        EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
        return [e.strip() for e in raw.split(",") if EMAIL_RE.match(e.strip())]
```

---

## 7. VARIABLE SYSTEM — FULL SPECIFICATION

### Built-in Variables (always available)

| Variable | Value |
|---|---|
| `{Website}` | From Excel "Website" column |
| `{Email}` | Recipient email address |
| `{Domain}` | Domain part of recipient email |
| `{SenderName}` | Display name of sending account |
| `{SenderEmail}` | Sending email address |
| `{Date}` | Today's date (e.g. "March 1, 2025") |
| `{Day}` | Day of week (e.g. "Monday") |
| `{Time}` | Current time (e.g. "9:15 AM") |
| `{Month}` | Month name (e.g. "March") |
| `{Year}` | Current year |
| `{UnsubLink}` | Unsubscribe URL (tracking server) |
| `{TrackingId}` | Unique tracking ID for this send |
| `{CampaignName}` | Name of current campaign |
| `{RowNumber}` | Row index in Excel (1-based) |

### Excel Column Variables (auto-detected)

Every column in the uploaded Excel file automatically becomes a variable:
- Column "FirstName" → `{FirstName}`
- Column "Company" → `{Company}`  
- Column "Industry" → `{Industry}`
- Column "LinkedIn" → `{LinkedIn}`
- Column "Phone" → `{Phone}`
- Column "Title" → `{Title}`
- Column "City" → `{City}`
- Column "Country" → `{Country}`
- Any column → `{ColumnName}` (spaces stripped, title-cased)

### Custom Static Variables

Defined in the Variable Manager, stored in `variable_definitions` DB table. These are fixed values (not from Excel) that you set once and reuse:

| Variable | Example Value |
|---|---|
| `{MyName}` | Abdullah |
| `{MyTitle}` | Founder & CEO |
| `{MyCalLink}` | https://cal.com/yourname |
| `{MyCompany}` | ACME Labs |
| `{Offer1}` | Free 14-day trial |
| `{PS}` | P.S. — We also do X... |

### Variable Filters (Jinja2 syntax)

```
{{ FirstName | title }}        → "john" → "John"
{{ FirstName | upper }}        → "john" → "JOHN"
{{ Website | replace("https://","") }}  → strips protocol
{{ Company | truncate(20) }}   → truncates long names
{{ Date | default("today") }}  → fallback if empty
```

### Spintax
```
{Hi|Hello|Hey} {FirstName},
```
Randomly picks one option per recipient — creates email variety.

---

## 8. SETTINGS TAB (OMEGA)

```
SENDING ENGINE
  Min delay between emails:  [0    ] seconds
  Max delay between emails:  [0    ] seconds  ← both 0 = max speed
  Daily cap per account:     [0    ] (0 = unlimited)
  Retry failed emails:       [ON ●] attempts: [5]
  Retry backoff:             [30   ] seconds between retries
  Skip blacklisted:          [ON ●]
  Auto-add hard bounces:     [ON ●]

AI ENGINE
  OpenAI API Key:    [sk-●●●●●●●●●●●●●●●●●●●●] [Test]
  Anthropic API Key: [sk-ant-●●●●●●●●●●●●●●●●] [Test]
  Default engine:    [GPT-4o ▾]

TRACKING SERVER
  Server URL:        [http://localhost:5500   ]
  [Start Local Server]  [Test Pixel]
  Auto-start on launch: [ON ●]
  Expose via ngrok:     [OFF ○]  ngrok token: [_______]

NOTIFICATIONS
  Desktop alerts on open:    [ON ●]
  Campaign complete sound:   [ON ●]
  Error alerts:              [ON ●]

SECURITY
  Encrypt stored credentials: [ON ●]
  Encryption key: [auto-generated, shown once]
  [Change Encryption Key]  [Export Backup]

DATA
  Database location: /path/to/omega.db  [Change]
  [Export All Data as Excel]  [Full Backup ZIP]  [Wipe All Data]

ADVANCED
  Max concurrent threads:    [1    ] (increase for parallel campaigns)
  Log verbosity:             [DEBUG ▾]
  Custom SMTP timeout:       [30   ] seconds
  [View Raw Database]  [Open App Folder]
```

---

## 9. KNOWN BUGS FIXED (same 7 from public spec, plus 2 more)

All 7 bugs from the public spec are fixed. Additionally:

### Bug #8 — Silent failure when Excel has BOM encoding
Excel files exported from some tools have a BOM (`\ufeff`) that corrupts column names.
```python
df.columns = [c.strip().lstrip('\ufeff').strip() for c in df.columns]
```

### Bug #9 — `time.sleep()` blocks `stop_event` check
When sleeping between sends, the stop button is unresponsive until the sleep ends.
```python
# Replace time.sleep(delay) with:
def interruptible_sleep(stop_event: threading.Event, seconds: float, step: float = 0.1):
    elapsed = 0
    while elapsed < seconds and not stop_event.is_set():
        time.sleep(step)
        elapsed += step
```

---

## 10. SETUP & RUN

### `.env` file
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
TRACKING_SERVER_URL=http://localhost:5500
TRACKING_SERVER_PORT=5500
ENCRYPTION_KEY=                # auto-generated on first run
NGROK_AUTH_TOKEN=              # optional
```

### Gmail OAuth
Same as public spec — `credentials/gmail_credentials.json`

### Outlook OAuth
Same as public spec — `credentials/outlook_credentials.json`

### First Run
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
# → First launch: generates encryption key, initializes DB, starts tracking server
```

### Build Executable
```bash
pyinstaller --onefile --windowed --name "OMEGA" \
  --add-data "credentials:credentials" \
  --add-data "assets:assets" \
  --add-data "tracking:tracking" \
  main.py
```

---

## 11. FEATURE SUMMARY TABLE

| Feature | Status | Notes |
|---|---|---|
| Gmail OAuth2 sending | ✅ Core | Enhanced with auto token refresh |
| Outlook OAuth2 sending | ✅ Core | MSAL + Graph API |
| Custom IMAP/SMTP | ✅ Core | Any provider, OS keyring passwords |
| Yahoo/AOL (app password) | ✅ Core | Via SMTP |
| Unlimited send speed | ✅ OMEGA | No delays by default |
| No daily send caps | ✅ OMEGA | 0 = unlimited |
| Multi-account rotation | ✅ OMEGA | Round-robin, weighted, random, parallel |
| Dynamic variable system | ✅ Core | Any Excel column → variable |
| Custom static variables | ✅ OMEGA | User-defined reusable variables |
| Spintax randomization | ✅ OMEGA | {Hi\|Hello\|Hey} per recipient |
| Jinja2 filters | ✅ OMEGA | title, upper, truncate, default, etc. |
| HTML email editor | ✅ Core | With live preview |
| Plain text mode | ✅ Core | |
| Email open tracking | ✅ OMEGA | Pixel tracking via local Flask server |
| Click tracking | ✅ OMEGA | Link wrapping via tracking server |
| Desktop open notifications | ✅ OMEGA | plyer push notifications |
| Scheduled send | ✅ OMEGA | APScheduler, any datetime |
| Timezone auto-detection | ✅ OMEGA | TLD-based + manual override |
| 9am local time targeting | ✅ OMEGA | Calculates UTC for recipient timezone |
| Repeating schedules | ✅ OMEGA | Daily, weekdays, custom cron |
| AI email generation (GPT-4o) | ✅ OMEGA | Full prompt with brief UI |
| AI email generation (Claude) | ✅ OMEGA | Fallback + dual engine |
| AI subject line variants | ✅ OMEGA | 1–10 variants |
| AI email sequence generator | ✅ OMEGA | 3-email cold sequences |
| AI rewrite/improve | ✅ OMEGA | Paste draft → improve |
| Account warm-up engine | ✅ OMEGA | 25-day progressive warmup schedule |
| Bounce detection (IMAP) | ✅ OMEGA | Auto-scan + blacklist |
| Global blacklist/suppression | ✅ OMEGA | Auto-populated from bounces |
| Unsubscribe link | ✅ OMEGA | Auto-unsub page via tracking server |
| Email sequence (drip) | ✅ OMEGA | Multi-step sequences per contact |
| Multi-account parallel sends | ✅ OMEGA | Rotation manager |
| Campaign pause/resume | ✅ Core | Saves last_index |
| Test send to self | ✅ Core | Uses row 1 data |
| Live preview with variables | ✅ Core | Updates as you type |
| Per-row variable preview | ✅ OMEGA | Browse all 1200 rows |
| Save/load templates | ✅ Core | SQLite templates table |
| Export send log (Excel) | ✅ OMEGA | openpyxl formatted export |
| Export campaign report (PDF) | ✅ OMEGA | reportlab formatted report |
| Analytics with Plotly charts | ✅ OMEGA | Interactive, zoomable |
| Terminal-style live log | ✅ OMEGA | Monospace, color-coded |
| Credential encryption | ✅ OMEGA | Fernet AES-256 |
| SQLite full campaign DB | ✅ Core | All history persisted |
| CSV + Excel + multi-format | ✅ Core | .xlsx .xls .csv |
| Desktop app (PyInstaller) | ✅ Core | Single .exe or .app |
| All 9 bugs fixed | ✅ | See Section 9 |

---

*OMEGA spec is complete. This is a personal power tool — build it all at once. No phased rollout needed.*
