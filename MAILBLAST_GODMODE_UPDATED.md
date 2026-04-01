# MailBlast OMEGA — Full Stack SaaS Specification (Updated)
> **Python Desktop App + Production-Grade Next.js SaaS Web App**  
> Zero paid services required. Groq AI (free). Vercel (free). Railway (free tier). One codebase.

---

## ⚠️ OWNER'S PRIVATE BUILD — NOT FOR DISTRIBUTION
Personal installation. Zero throttling. Full control. All features on by default.

---

## CHANGE LOG — What Was Updated in This Revision

| # | Change | Reason |
|---|---|---|
| 1 | **AI engine swapped to Groq** (llama-3.3-70b) | Free, no billing required |
| 2 | **Full Next.js 14 SaaS web frontend added** (Section 13) | World-class UI/UX layer |
| 3 | **3 syntax bugs fixed in base Python code** | App wouldn't run otherwise |
| 4 | **Free deployment stack documented** | Vercel + Railway free tiers |
| 5 | **Framer Motion + Lenis scroll animations spec added** | Out-of-the-world feel |
| 6 | **API bridge layer added** (FastAPI) | Connects Python core to Next.js |
| 7 | **Landing page / marketing site spec added** | SaaS product feel |

---

## BUG FIXES IN BASE CODE (3 New — Beyond Original 9)

### Bug #10 — Missing closing parenthesis (FATAL — app won't start)
In `send_outreach_emails`, the `create_email(...)` call is never closed:
```python
# BROKEN (original):
message = self.create_email(
    to_email=email,
    website=website,
    subject=self.subject_entry.get(),
    body=self.body_text.get("1.0", tk.END)

self.service.users()...

# FIXED:
message = self.create_email(
    to_email=email,
    website=website,
    subject=self.subject_entry.get(),
    body=self.body_text.get("1.0", tk.END)
)  # ← this closing paren was missing

self.service.users()...
```

### Bug #11 — Token expiry crash (`self.creds.valid` without refresh)
```python
# BROKEN: crashes after token expires
if not hasattr(self, 'creds') or not self.creds.valid:

# FIXED: auto-refresh expired tokens
def _get_valid_creds(self):
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, 'w') as f:
                f.write(creds.to_json())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=8080)
            with open(TOKEN_FILE, 'w') as f:
                f.write(creds.to_json())
    return creds
```

### Bug #12 — `root.update()` called from worker thread (GUI crash)
```python
# BROKEN: calling tkinter from non-main thread
def update_progress(self, sent, total):
    self.progress_label.config(...)
    self.root.update()   # ← not thread-safe

# FIXED: use root.after() to schedule on main thread
def update_progress(self, sent, total):
    self.root.after(0, lambda: self._safe_update_progress(sent, total))

def _safe_update_progress(self, sent, total):
    self.progress_label.config(text=f"Sent {sent}/{total} emails")
    self.progress_bar["value"] = sent
```

---

## AI ENGINE CHANGE — OpenAI/Anthropic → Groq (Free)

The original spec used OpenAI GPT-4o and Anthropic Claude. Both require paid API keys.  
**Groq is 100% free on the free tier** (14,400 requests/day, `llama-3.3-70b-versatile`).

### Updated `core/ai_generator.py`

```python
import os
import json
import re
from groq import Groq

class AIGenerator:
    """
    Single-engine AI using Groq (free).
    Model: llama-3.3-70b-versatile
    Free tier: 14,400 req/day, 6,000 tokens/min
    """
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)
        self.model = "llama-3.3-70b-versatile"

    def generate(self, brief: dict, mode: str = "email", variants: int = 1) -> list[dict]:
        prompt = self._build_prompt(brief, mode)
        results = []
        for _ in range(variants):
            results.append(self._call_groq(prompt))
        return results

    def _call_groq(self, prompt: str) -> dict:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert cold email copywriter. "
                        "Output ONLY raw JSON — no markdown, no backticks, no preamble. "
                        'Format: {"subject": "...", "body": "..."}'
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.85,
            max_tokens=1000
        )
        raw = resp.choices[0].message.content.strip()
        # Strip markdown code fences if model misbehaves
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        data["tokens_used"] = resp.usage.total_tokens
        data["engine"] = "groq/llama-3.3-70b"
        return data

    def rewrite(self, draft: str, instruction: str) -> dict:
        prompt = (
            f"Rewrite this cold email with this instruction: {instruction}\n\n"
            f"---\n{draft}\n---\n"
            'Return ONLY JSON: {"subject": "...", "body": "..."}'
        )
        return self._call_groq(prompt)

    def generate_subjects(self, context: str, count: int = 10) -> list[str]:
        prompt = (
            f"Generate {count} compelling cold email subject lines for: {context}. "
            "Return ONLY a JSON array of strings. No markdown."
        )
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=500
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)

    def generate_sequence(self, brief: dict, num_emails: int = 3) -> list[dict]:
        prompt = (
            f"Create a {num_emails}-email cold outreach sequence.\n"
            f"Product: {brief.get('product')}\n"
            f"Target: {brief.get('audience')}\n"
            f"Tone: {brief.get('tone', 'professional')}\n\n"
            "Email 1: Initial outreach (Day 0)\n"
            "Email 2: Follow-up (Day 3)\n"
            "Email 3: Break-up email (Day 7)\n\n"
            "Use variables: {FirstName}, {Company}, {Website}\n"
            'Return ONLY JSON array: [{"subject":"...","body":"...","send_day":0}, ...]'
        )
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=2000
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)

    def _build_prompt(self, brief: dict, mode: str) -> str:
        return (
            "Write a cold outreach email:\n"
            f"- Product/Service: {brief.get('product', 'our product')}\n"
            f"- Target audience: {brief.get('audience', 'business owners')}\n"
            f"- Tone: {brief.get('tone', 'professional but friendly')}\n"
            f"- Length: {brief.get('length', 'medium (150-200 words)')}\n"
            f"- CTA: {brief.get('cta', 'schedule a quick call')}\n\n"
            "Rules:\n"
            "- Use {FirstName}, {Company}, {Website} naturally\n"
            "- No 'I hope this email finds you well'\n"
            "- Feel personal, not spammy\n"
            'Return ONLY JSON: {"subject": "...", "body": "..."}'
        )
```

### Updated `.env` file
```env
# AI (Groq — free, get key at console.groq.com)
GROQ_API_KEY=gsk_...

# Tracking
TRACKING_SERVER_URL=http://localhost:5500
TRACKING_SERVER_PORT=5500

# Security
ENCRYPTION_KEY=   # auto-generated on first run

# Optional
NGROK_AUTH_TOKEN=
```

### Updated `requirements.txt`
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
groq>=0.9.0
APScheduler>=3.10.0
Flask>=3.0.0
Flask-Cors>=4.0.0
fastapi>=0.110.0
uvicorn>=0.29.0
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

## SECTION 1–12: ALL ORIGINAL CONTENT PRESERVED

> Everything in sections 1–12 of the original OMEGA spec remains unchanged.  
> All 9 original bugs are still fixed as specified.  
> The 3 additional bugs above (10, 11, 12) are layered on top.  
> Only the AI engine (`core/ai_generator.py`) and `.env`/`requirements.txt` change.

---

## SECTION 13 — NEXT.JS SAAS WEB APP LAYER

> This is the world-class UI/UX layer on top of the Python core.  
> The Python app runs locally (or on Railway). The Next.js frontend talks to it via a FastAPI bridge.  
> **Local use:** Run `python api_bridge.py` + `npm run dev` on your laptop. Done.  
> **Deploy anytime:** Push frontend to Vercel. Push backend to Railway. Both free tiers.

---

### 13.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│              Next.js 14 (App Router)                     │
│         Tailwind CSS + Framer Motion + Lenis             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / WebSocket
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Bridge (api_bridge.py)              │
│     Runs locally (laptop) or Railway (deployed)          │
│   Exposes REST API + WebSocket for live log stream       │
└────────────────────┬────────────────────────────────────┘
                     │ Python function calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│           MailBlast OMEGA Python Core                    │
│  Gmail/Outlook/SMTP + Groq AI + SQLite + Tracking       │
└─────────────────────────────────────────────────────────┘
```

---

### 13.2 Free Deployment Stack

| Layer | Service | Cost | Notes |
|---|---|---|---|
| Frontend | **Vercel** | Free | Auto-deploys from GitHub |
| Python API | **Railway** | Free ($5 credit/mo) | `python api_bridge.py` |
| Database | **SQLite** (local file) | Free | On Railway persistent volume |
| AI | **Groq** | Free | 14,400 req/day |
| Tracking server | **Railway** (same instance) | Free | Flask on port 5500 |
| Domain | **Vercel subdomain** | Free | `yourapp.vercel.app` |

**For local-only use (laptop):**
```bash
# Terminal 1 — Python backend
python api_bridge.py          # starts at localhost:8000

# Terminal 2 — Next.js frontend  
npm run dev                   # starts at localhost:3000
```

**To deploy:**
```bash
# Push to GitHub → Vercel auto-deploys frontend
# Push to GitHub → Railway auto-deploys backend
# Set NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app in Vercel env vars
```

---

### 13.3 Project Structure (Web App)

```
mailblast-web/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout — fonts, providers, Lenis
│   ├── page.tsx                  # Landing / marketing page
│   ├── dashboard/
│   │   └── page.tsx              # Main app dashboard
│   ├── compose/
│   │   └── page.tsx              # Compose + send tab
│   ├── campaigns/
│   │   └── page.tsx              # Campaign history & analytics
│   ├── ai-studio/
│   │   └── page.tsx              # AI email generator
│   ├── accounts/
│   │   └── page.tsx              # Email account manager
│   ├── scheduler/
│   │   └── page.tsx              # Schedule campaigns
│   ├── analytics/
│   │   └── page.tsx              # Full analytics charts
│   ├── settings/
│   │   └── page.tsx              # Settings
│   └── warmup/
│       └── page.tsx              # Warm-up engine
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Animated collapsible sidebar
│   │   ├── Topbar.tsx            # Live status bar
│   │   └── SmoothScroll.tsx     # Lenis scroll provider
│   ├── ui/
│   │   ├── StatCard.tsx          # Animated KPI cards
│   │   ├── TerminalLog.tsx       # Live terminal feed
│   │   ├── PulseDot.tsx          # Breathing cyan dot
│   │   ├── ProgressRing.tsx      # SVG progress ring
│   │   ├── CampaignCard.tsx      # Campaign row card
│   │   └── Badge.tsx             # Provider badges (Gmail, Outlook...)
│   ├── compose/
│   │   ├── SubjectEditor.tsx     # Subject line input with variable highlights
│   │   ├── BodyEditor.tsx        # Textarea with spintax + variable tokens
│   │   ├── VariablePanel.tsx     # Live variable manager sidebar
│   │   ├── PreviewPanel.tsx      # Per-row live preview
│   │   └── SpeedSlider.tsx       # Send speed control
│   ├── ai/
│   │   ├── BriefForm.tsx         # AI brief input form
│   │   └── OutputPanel.tsx       # Generated email with copy/use buttons
│   ├── charts/
│   │   ├── OpenRateChart.tsx     # Recharts line chart
│   │   ├── SendVolumeChart.tsx   # Bar chart
│   │   └── FunnelChart.tsx       # Sent → Opened → Clicked funnel
│   └── landing/
│       ├── Hero.tsx              # Animated hero section
│       ├── Features.tsx          # Feature cards with scroll reveals
│       ├── Demo.tsx              # Dashboard screenshot / demo
│       ├── Testimonials.tsx      # Social proof
│       └── CTA.tsx               # Call to action
├── lib/
│   ├── api.ts                    # API client (fetch wrapper)
│   ├── hooks/
│   │   ├── useCampaigns.ts       # SWR hooks
│   │   ├── useAccounts.ts
│   │   ├── useLiveLog.ts         # WebSocket live log hook
│   │   └── useAnalytics.ts
│   └── types.ts                  # TypeScript types
├── public/
│   └── fonts/                    # JetBrains Mono (self-hosted)
├── styles/
│   └── globals.css               # Tailwind + CSS variables
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

### 13.4 Tech Stack (Web)

```json
{
  "framework": "Next.js 14 (App Router)",
  "styling": "Tailwind CSS 3.4",
  "animations": {
    "scroll": "Lenis (smooth scroll)",
    "motion": "Framer Motion 11",
    "micro": "tailwindcss-animate"
  },
  "charts": "Recharts 2.x",
  "data_fetching": "SWR (stale-while-revalidate)",
  "live_updates": "WebSocket (native browser API)",
  "icons": "Lucide React",
  "editor": "CodeMirror 6 (body editor with syntax highlight)",
  "file_upload": "react-dropzone",
  "fonts": "JetBrains Mono (CDN) + Inter (next/font)",
  "ui_primitives": "Radix UI (headless)",
  "notifications": "Sonner (toast)",
  "state": "Zustand"
}
```

**`package.json` dependencies:**
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "@studio-freight/lenis": "^1.0.45",
    "recharts": "^2.12.0",
    "swr": "^2.2.5",
    "zustand": "^4.5.0",
    "lucide-react": "^0.378.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@codemirror/view": "^6.26.0",
    "@codemirror/state": "^6.4.1",
    "@codemirror/lang-html": "^6.4.8",
    "react-dropzone": "^14.2.3",
    "sonner": "^1.4.41",
    "tailwindcss-animate": "^1.0.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

---

### 13.5 Design System — Web Version ("OMEGA DARK Web")

The web app mirrors the desktop design language with web-native additions.

#### CSS Variables (`styles/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  /* Surfaces */
  --bg-root:       #060608;
  --bg-sidebar:    #0A0A0E;
  --bg-panel:      #0E0E14;
  --bg-card:       #121218;
  --bg-elevated:   #18181F;
  --bg-input:      #1C1C25;
  --bg-hover:      #1E1E28;
  --bg-selected:   #1A1A2E;

  /* Accent */
  --accent:        #00E5FF;
  --accent-dim:    #00B4CC;
  --accent-glow:   rgba(0, 229, 255, 0.12);
  --accent-glow-strong: rgba(0, 229, 255, 0.25);

  /* Status */
  --status-success: #00FF9D;
  --status-error:   #FF3B5C;
  --status-warn:    #FFB800;
  --status-idle:    #3A3A50;

  /* Text */
  --text-primary:   #E8E8F0;
  --text-secondary: #707088;
  --text-muted:     #3A3A50;
  --text-accent:    #00E5FF;
  --text-code:      #A0FFA0;

  /* Borders */
  --border:         #1A1A28;
  --border-accent:  #00E5FF;
  --border-error:   #FF3B5C;

  /* Provider colors */
  --gmail:    #EA4335;
  --outlook:  #0078D4;
  --imap:     #00FF9D;
  --yahoo:    #6001D2;
}

* { box-sizing: border-box; }

html {
  background: var(--bg-root);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Smooth scrollbar */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg-panel); }
::-webkit-scrollbar-thumb { background: var(--border-accent); border-radius: 4px; }

/* Cyan text glow utility */
.glow-text {
  color: var(--accent);
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
}

/* Card glow on hover */
.card-glow:hover {
  box-shadow: 0 0 0 1px var(--accent), 0 0 30px var(--accent-glow);
}
```

#### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          root:     '#060608',
          sidebar:  '#0A0A0E',
          panel:    '#0E0E14',
          card:     '#121218',
          elevated: '#18181F',
          input:    '#1C1C25',
          hover:    '#1E1E28',
          selected: '#1A1A2E',
        },
        accent:  '#00E5FF',
        success: '#00FF9D',
        error:   '#FF3B5C',
        warn:    '#FFB800',
        muted:   '#3A3A50',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'slide-up':   'slideUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          from: { textShadow: '0 0 10px rgba(0,229,255,0.3)' },
          to:   { textShadow: '0 0 25px rgba(0,229,255,0.8)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      boxShadow: {
        'accent-sm': '0 0 0 1px #00E5FF',
        'accent-md': '0 0 0 1px #00E5FF, 0 0 20px rgba(0,229,255,0.15)',
        'accent-lg': '0 0 0 1px #00E5FF, 0 0 40px rgba(0,229,255,0.25)',
        'card':      '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

---

### 13.6 Scroll & Animation System

#### Lenis Smooth Scroll Setup (`components/layout/SmoothScroll.tsx`)
```tsx
'use client'
import Lenis from '@studio-freight/lenis'
import { useEffect, useRef } from 'react'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })
    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [])

  return <>{children}</>
}
```

#### Section Reveal Animations (Framer Motion)
Every section on the landing page and dashboard uses this pattern:

```tsx
// components/ui/RevealSection.tsx
'use client'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface RevealSectionProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'right'
}

export function RevealSection({ children, delay = 0, direction = 'up' }: RevealSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 40 : 0,
      x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
```

#### Staggered Card Grid Animation
```tsx
// Use on Features section, dashboard stat cards, etc.
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// <motion.div variants={containerVariants} initial="hidden" animate="visible">
//   {cards.map(card => <motion.div variants={itemVariants}>...</motion.div>)}
// </motion.div>
```

#### Number Counter Animation (for KPI cards)
```tsx
// components/ui/AnimatedCounter.tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const spring = useSpring({
    from: { val: 0 },
    to: { val: isInView ? value : 0 },
    config: { tension: 40, friction: 20 },
  })

  return (
    <span ref={ref} className="font-mono text-accent">
      <animated.span>{spring.val.to(v => Math.floor(v).toLocaleString())}</animated.span>
      {suffix}
    </span>
  )
}
```

---

### 13.7 Landing Page (`app/page.tsx`)

The marketing/landing page. Scroll-driven. Cinematic. Converts visitors to install the tool.

#### Section Structure
```
1. Hero          — "Send 10,000 Cold Emails. While You Sleep."
2. Social Proof  — Live counter: emails sent today (from API)
3. Features      — 6 feature cards with scroll reveal
4. Demo          — Dashboard screenshot with parallax + glow
5. How It Works  — 3-step horizontal timeline
6. AI Studio     — Groq AI section with demo
7. Tracking      — Open tracking visualization
8. CTA           — "Run it on your laptop. Deploy when ready."
```

#### Hero Component (`components/landing/Hero.tsx`)
```tsx
'use client'
import { motion } from 'framer-motion'
import { PulseDot } from '@/components/ui/PulseDot'

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Radial glow center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 border border-border bg-bg-card px-4 py-1.5 rounded-full text-sm text-text-secondary mb-8"
      >
        <PulseDot />
        <span>Now running on your machine</span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-5xl md:text-7xl lg:text-8xl font-bold text-center leading-[1.05] tracking-tight max-w-5xl"
      >
        Send{' '}
        <span className="text-accent glow-text">10,000 Cold Emails.</span>
        <br />
        While You Sleep.
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="mt-6 text-lg md:text-xl text-text-secondary text-center max-w-2xl leading-relaxed"
      >
        Gmail + Outlook + SMTP. AI-written copy with Groq. Open tracking. Multi-account rotation.
        <br />
        Zero paid APIs. Zero rate limits. Runs on your laptop.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4 mt-10"
      >
        <button className="px-8 py-3.5 bg-accent text-bg-root font-semibold rounded-lg hover:bg-accent-dim transition-all duration-200 shadow-accent-md hover:shadow-accent-lg">
          Open Dashboard →
        </button>
        <button className="px-8 py-3.5 border border-border bg-bg-card text-text-primary font-medium rounded-lg hover:border-accent transition-all duration-200">
          View on GitHub
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="flex gap-12 mt-16 text-center"
      >
        {[
          { label: 'Emails Sent', value: '2.4M+' },
          { label: 'Open Rate', value: '31%' },
          { label: 'Providers', value: '4' },
          { label: 'API Cost', value: '$0' },
        ].map(stat => (
          <div key={stat.label}>
            <div className="text-2xl font-bold font-mono text-accent">{stat.value}</div>
            <div className="text-sm text-text-secondary mt-1">{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
```

#### Features Section (`components/landing/Features.tsx`)
```tsx
'use client'
import { motion } from 'framer-motion'
import { RevealSection } from '@/components/ui/RevealSection'
import { Zap, Bot, BarChart2, RefreshCw, Clock, Shield } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Zero Rate Limits',
    desc: 'Send at SMTP max speed. No artificial caps. No daily limits enforced by the UI.',
    color: '#FFB800',
  },
  {
    icon: Bot,
    title: 'Groq AI Copywriting',
    desc: 'LLaMA 3.3 70B writes your cold emails. Free. 14,400 requests per day.',
    color: '#00E5FF',
  },
  {
    icon: BarChart2,
    title: 'Real-Time Tracking',
    desc: 'Pixel-level open and click tracking. Desktop notification when your email is opened.',
    color: '#00FF9D',
  },
  {
    icon: RefreshCw,
    title: 'Multi-Account Rotation',
    desc: 'Round-robin or random across Gmail, Outlook, and IMAP accounts simultaneously.',
    color: '#00E5FF',
  },
  {
    icon: Clock,
    title: 'Smart Scheduler',
    desc: 'Auto-detect recipient timezone. Send at 9am local time anywhere in the world.',
    color: '#A855F7',
  },
  {
    icon: Shield,
    title: 'Bounce Protection',
    desc: 'IMAP bounce scanner. Auto-populates global suppression list. Never retry a hard bounce.',
    color: '#FF3B5C',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export function Features() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <RevealSection>
        <div className="text-center mb-16">
          <p className="text-accent font-mono text-sm tracking-widest uppercase mb-3">Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-bold">Everything you need.<br/>Nothing you don't.</h2>
        </div>
      </RevealSection>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {features.map(f => (
          <motion.div
            key={f.title}
            variants={cardVariants}
            className="group relative bg-bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:bg-bg-elevated transition-all duration-300 card-glow cursor-default"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                 style={{ background: `${f.color}15` }}>
              <f.icon size={20} style={{ color: f.color }} />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>

            {/* Corner accent on hover */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style={{ background: `radial-gradient(circle at top right, ${f.color}10, transparent)` }} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
```

---

### 13.8 Dashboard Page (`app/dashboard/page.tsx`)

```tsx
'use client'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/ui/StatCard'
import { TerminalLog } from '@/components/ui/TerminalLog'
import { CampaignCard } from '@/components/ui/CampaignCard'
import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { useLiveLog } from '@/lib/hooks/useLiveLog'
import { Send, Eye, MousePointer, Zap } from 'lucide-react'

export default function DashboardPage() {
  const { campaigns } = useCampaigns()
  const { stats } = useAnalytics()
  const { logs } = useLiveLog()

  return (
    <div className="p-6 space-y-6">

      {/* KPI Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={Send}        label="Total Sent"   value={stats?.total_sent}   suffix=""  color="accent"   />
        <StatCard icon={Eye}         label="Open Rate"    value={stats?.open_rate}    suffix="%" color="success"  />
        <StatCard icon={MousePointer} label="Click Rate"  value={stats?.click_rate}   suffix="%" color="warn"     />
        <StatCard icon={Zap}         label="Today Sent"   value={stats?.today_sent}   suffix=""  color="accent"   />
      </motion.div>

      {/* Active Campaigns + Live Log */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Active Campaigns (left, 60%) */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-mono text-text-secondary uppercase tracking-widest">Active Campaigns</h2>
          {campaigns?.filter(c => c.status === 'running').map(c => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>

        {/* Live Terminal Log (right, 40%) */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-mono text-text-secondary uppercase tracking-widest mb-3">Live Feed</h2>
          <TerminalLog logs={logs} />
        </div>
      </div>
    </div>
  )
}
```

#### Stat Card Component (`components/ui/StatCard.tsx`)
```tsx
'use client'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | undefined
  suffix: string
  color: 'accent' | 'success' | 'warn' | 'error'
}

const colorMap = {
  accent:  { bg: 'bg-accent/10',  text: 'text-accent',   icon: '#00E5FF' },
  success: { bg: 'bg-success/10', text: 'text-success',  icon: '#00FF9D' },
  warn:    { bg: 'bg-warn/10',    text: 'text-warn',     icon: '#FFB800' },
  error:   { bg: 'bg-error/10',   text: 'text-error',    icon: '#FF3B5C' },
}

export function StatCard({ icon: Icon, label, value, suffix, color }: StatCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
      className="bg-bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-all duration-300 hover:shadow-card group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center`}>
          <Icon size={16} style={{ color: c.icon }} />
        </div>
        <span className="text-xs font-mono text-text-muted">↑ 12%</span>
      </div>
      <div className={`text-3xl font-bold font-mono ${c.text} mb-1`}>
        {value !== undefined ? <><AnimatedCounter value={value} />{suffix}</> : '—'}
      </div>
      <div className="text-xs text-text-secondary">{label}</div>
    </motion.div>
  )
}
```

#### Terminal Log Component (`components/ui/TerminalLog.tsx`)
```tsx
'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LogEntry {
  id: string
  time: string
  type: 'sent' | 'opened' | 'failed' | 'skipped'
  email: string
  website: string
  detail?: string
}

const typeConfig = {
  sent:    { symbol: '→', label: 'SENT',    color: 'text-accent'   },
  opened:  { symbol: '★', label: 'OPENED',  color: 'text-success'  },
  failed:  { symbol: '✗', label: 'FAILED',  color: 'text-error'    },
  skipped: { symbol: '·', label: 'SKIP',    color: 'text-muted'    },
}

export function TerminalLog({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="bg-bg-root border border-border rounded-xl h-[420px] overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-bg-panel">
        <div className="w-2.5 h-2.5 rounded-full bg-error" />
        <div className="w-2.5 h-2.5 rounded-full bg-warn" />
        <div className="w-2.5 h-2.5 rounded-full bg-success" />
        <span className="ml-3 text-xs font-mono text-text-muted">live_feed.log</span>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5 font-mono text-xs">
        <AnimatePresence initial={false}>
          {logs.map(log => {
            const cfg = typeConfig[log.type]
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-baseline gap-3 py-0.5 hover:bg-bg-card/50 px-1 rounded transition-colors"
              >
                <span className="text-text-muted shrink-0">[{log.time}]</span>
                <span className={`${cfg.color} shrink-0 w-12`}>{cfg.symbol} {cfg.label}</span>
                <span className="text-text-primary truncate">{log.email}</span>
                <span className="text-text-secondary truncate hidden sm:block">({log.website})</span>
                {log.detail && <span className="text-error text-xs truncate">{log.detail}</span>}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

---

### 13.9 Sidebar Component (`components/layout/Sidebar.tsx`)

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { PulseDot } from '@/components/ui/PulseDot'
import {
  LayoutDashboard, Mail, RefreshCw, Calendar,
  Bot, BarChart2, Flame, Inbox, FileText,
  Ban, Settings, ChevronLeft
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/compose',    icon: Mail,            label: 'Compose'    },
  { href: '/rotation',   icon: RefreshCw,       label: 'Rotation'   },
  { href: '/scheduler',  icon: Calendar,        label: 'Scheduler'  },
  { href: '/ai-studio',  icon: Bot,             label: 'AI Studio'  },
  { href: '/analytics',  icon: BarChart2,       label: 'Analytics'  },
  { href: '/warmup',     icon: Flame,           label: 'Warm-Up'    },
  { href: '/accounts',   icon: Inbox,           label: 'Accounts'   },
  { href: '/templates',  icon: FileText,        label: 'Templates'  },
  { href: '/blacklist',  icon: Ban,             label: 'Blacklist'  },
  { href: '/settings',   icon: Settings,        label: 'Settings'   },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex flex-col h-screen bg-bg-sidebar border-r border-border shrink-0 overflow-hidden"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 mt-1">
        <PulseDot />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-mono font-bold text-accent text-sm tracking-wider">OMEGA</div>
              <div className="font-mono text-text-muted text-[10px]">Private Build</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-4 mb-4 h-[1px] bg-border" />

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-200 group
                ${active
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-transparent'
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-accent/8 rounded-lg border border-accent/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon size={16} className="shrink-0 relative z-10" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-4 text-text-muted hover:text-accent transition-colors"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronLeft size={16} />
        </motion.div>
      </button>
    </motion.aside>
  )
}
```

---

### 13.10 AI Studio Page (`app/ai-studio/page.tsx`)

```tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Sparkles, RefreshCw, Copy, ArrowRight } from 'lucide-react'

export default function AIStudioPage() {
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<{subject: string; body: string; tokens_used: number} | null>(null)
  const [mode, setMode] = useState<'email' | 'rewrite' | 'subjects' | 'sequence'>('email')
  const [brief, setBrief] = useState({
    product: '', audience: '', tone: 'professional', length: 'medium', cta: 'schedule a call'
  })

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, mode }),
      })
      const data = await res.json()
      setOutput(data.result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <Bot size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Studio</h1>
          <p className="text-sm text-text-secondary">Powered by Groq · LLaMA 3.3 70B · Free</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left — Input */}
        <div className="space-y-5">
          {/* Mode tabs */}
          <div className="flex bg-bg-card border border-border rounded-lg p-1 gap-1">
            {['email', 'rewrite', 'subjects', 'sequence'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-mono capitalize transition-all ${
                  mode === m
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Brief fields */}
          <div className="space-y-3">
            {[
              { key: 'product',  label: 'Product / Service',  placeholder: 'e.g. AI scheduling tool for agencies' },
              { key: 'audience', label: 'Target Audience',    placeholder: 'e.g. marketing agencies, 10–50 employees' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-mono text-text-secondary mb-1.5">{f.label}</label>
                <input
                  type="text"
                  value={(brief as any)[f.key]}
                  onChange={e => setBrief(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:shadow-accent-sm transition-all"
                />
              </div>
            ))}

            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'tone',   label: 'Tone',   options: ['professional', 'friendly', 'direct', 'casual'] },
                { key: 'length', label: 'Length', options: ['short', 'medium', 'long'] },
                { key: 'cta',    label: 'CTA',    options: ['schedule a call', 'reply to learn more', 'visit our site', 'free trial'] },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5">{f.label}</label>
                  <select
                    value={(brief as any)[f.key]}
                    onChange={e => setBrief(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-all"
                  >
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !brief.product}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-bg-root font-semibold rounded-lg hover:bg-accent-dim transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin" /> Generating with Groq...</>
            ) : (
              <><Sparkles size={16} /> Generate Email</>
            )}
          </button>
        </div>

        {/* Right — Output */}
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-panel">
            <span className="text-xs font-mono text-text-secondary">GENERATED OUTPUT</span>
            {output && (
              <span className="text-xs font-mono text-text-muted">{output.tokens_used} tokens</span>
            )}
          </div>

          <div className="p-5">
            {!output ? (
              <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                <Bot size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Fill in the brief and generate</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-mono text-text-secondary">SUBJECT</label>
                  <div className="mt-1.5 bg-bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary font-medium">
                    {output.subject}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-text-secondary">BODY</label>
                  <div className="mt-1.5 bg-bg-input border border-border rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap leading-relaxed font-mono">
                    {output.body}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(`Subject: ${output.subject}\n\n${output.body}`)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-all"
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent hover:bg-accent/20 transition-all">
                    <ArrowRight size={14} /> Use in Compose
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 13.11 Analytics Charts (`components/charts/`)

```tsx
// components/charts/OpenRateChart.tsx
'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

export function OpenRateChart({ data }: { data: { date: string; rate: number }[] }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-mono text-text-secondary uppercase tracking-widest mb-5">Open Rate — 30 Days</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: '#707088', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
          <YAxis tick={{ fill: '#707088', fontSize: 11, fontFamily: 'JetBrains Mono' }} unit="%" />
          <Tooltip
            contentStyle={{ background: '#18181F', border: '1px solid #1A1A28', borderRadius: 8 }}
            labelStyle={{ color: '#E8E8F0', fontFamily: 'JetBrains Mono', fontSize: 12 }}
            itemStyle={{ color: '#00E5FF' }}
          />
          <Line
            type="monotone" dataKey="rate" stroke="#00E5FF" strokeWidth={2}
            dot={false} activeDot={{ r: 4, fill: '#00E5FF', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

### 13.12 FastAPI Bridge (`api_bridge.py`)

This is the Python file that connects Next.js to the OMEGA Python core.

```python
"""
api_bridge.py — FastAPI bridge between Next.js frontend and OMEGA Python core.

Local: python api_bridge.py         → http://localhost:8000
Deploy: Railway / Render free tier  → set NEXT_PUBLIC_API_URL in Vercel env vars
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MailBlast OMEGA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AI Endpoints ──────────────────────────────────────────

class GenerateRequest(BaseModel):
    brief: dict
    mode: str = "email"
    variants: int = 1

@app.post("/api/ai/generate")
async def generate_email(req: GenerateRequest):
    from core.ai_generator import AIGenerator
    ai = AIGenerator(groq_api_key=os.getenv("GROQ_API_KEY"))
    results = ai.generate(req.brief, mode=req.mode, variants=req.variants)
    return {"result": results[0], "all_variants": results}

@app.post("/api/ai/rewrite")
async def rewrite_email(body: dict):
    from core.ai_generator import AIGenerator
    ai = AIGenerator(groq_api_key=os.getenv("GROQ_API_KEY"))
    result = ai.rewrite(draft=body["draft"], instruction=body["instruction"])
    return {"result": result}

@app.post("/api/ai/subjects")
async def generate_subjects(body: dict):
    from core.ai_generator import AIGenerator
    ai = AIGenerator(groq_api_key=os.getenv("GROQ_API_KEY"))
    subjects = ai.generate_subjects(context=body["context"], count=body.get("count", 10))
    return {"subjects": subjects}

# ── Campaign Endpoints ────────────────────────────────────

@app.get("/api/campaigns")
async def list_campaigns():
    from data.db import get_all_campaigns
    return {"campaigns": get_all_campaigns()}

@app.get("/api/campaigns/{campaign_id}")
async def get_campaign(campaign_id: int):
    from data.db import get_campaign
    c = get_campaign(campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c

@app.post("/api/campaigns/{campaign_id}/start")
async def start_campaign(campaign_id: int, background_tasks: BackgroundTasks):
    from core.sender import run_campaign_async
    background_tasks.add_task(run_campaign_async, campaign_id)
    return {"status": "started", "campaign_id": campaign_id}

@app.post("/api/campaigns/{campaign_id}/stop")
async def stop_campaign(campaign_id: int):
    from core.sender import stop_campaign
    stop_campaign(campaign_id)
    return {"status": "stopped"}

# ── Analytics Endpoints ───────────────────────────────────

@app.get("/api/analytics/stats")
async def get_stats():
    from data.db import get_global_stats
    return get_global_stats()

@app.get("/api/analytics/open-rate-history")
async def get_open_rate_history():
    from data.db import get_open_rate_history
    return {"data": get_open_rate_history(days=30)}

@app.get("/api/analytics/send-log")
async def get_send_log(campaign_id: int = None, limit: int = 100):
    from data.db import get_send_log
    return {"log": get_send_log(campaign_id=campaign_id, limit=limit)}

# ── Accounts Endpoints ────────────────────────────────────

@app.get("/api/accounts")
async def list_accounts():
    from data.db import get_all_accounts
    return {"accounts": get_all_accounts()}

@app.post("/api/accounts/gmail/auth-url")
async def gmail_auth_url():
    """Returns OAuth URL for Gmail login from web browser."""
    from core.gmail_client import get_oauth_url
    return {"url": get_oauth_url()}

# ── WebSocket — Live Log ──────────────────────────────────

from fastapi import WebSocket
import asyncio
import json

connected_clients: list[WebSocket] = []

@app.websocket("/ws/live-log")
async def live_log_ws(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await asyncio.sleep(30)  # Keep alive
            await websocket.send_text(json.dumps({"type": "ping"}))
    except Exception:
        connected_clients.remove(websocket)

async def broadcast_log_event(event: dict):
    """Called by OmegaSender to push events to all browser clients."""
    for ws in connected_clients[:]:
        try:
            await ws.send_text(json.dumps(event))
        except Exception:
            connected_clients.remove(ws)

# ── Health Check ──────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

---

### 13.13 Live Log WebSocket Hook (`lib/hooks/useLiveLog.ts`)

```typescript
'use client'
import { useEffect, useState, useRef } from 'react'

interface LogEntry {
  id: string
  time: string
  type: 'sent' | 'opened' | 'failed' | 'skipped'
  email: string
  website: string
  detail?: string
}

export function useLiveLog(maxEntries = 200) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') ?? 'ws://localhost:8000'
    const ws = new WebSocket(`${wsUrl}/ws/live-log`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'ping') return

      setLogs(prev => {
        const newLog: LogEntry = {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          type: data.type,
          email: data.email,
          website: data.website || '',
          detail: data.error,
        }
        return [...prev.slice(-(maxEntries - 1)), newLog]
      })
    }

    return () => ws.close()
  }, [maxEntries])

  return { logs }
}
```

---

### 13.14 App Layout (`app/layout.tsx`)

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SmoothScrollProvider } from '@/components/layout/SmoothScroll'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from 'sonner'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MailBlast OMEGA',
  description: 'Private Email Outreach Command Center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg-root text-text-primary antialiased">
        <SmoothScrollProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: '#18181F',
                border: '1px solid #1A1A28',
                color: '#E8E8F0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
              },
            }}
          />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
```

---

### 13.15 Environment Variables

#### `.env.local` (Next.js — local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Vercel Environment Variables (deployed)
```env
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

#### `.env` (Python — same as before)
```env
GROQ_API_KEY=gsk_...
TRACKING_SERVER_URL=http://localhost:5500
FRONTEND_URL=https://your-app.vercel.app
ENCRYPTION_KEY=
NGROK_AUTH_TOKEN=
```

---

### 13.16 Deployment Checklist

#### Step 1 — Local run (laptop)
```bash
# Python backend
pip install -r requirements.txt
python api_bridge.py            # → http://localhost:8000

# Next.js frontend (separate terminal)
cd mailblast-web
npm install
npm run dev                     # → http://localhost:3000
```

#### Step 2 — Deploy to Vercel (frontend, free)
```bash
cd mailblast-web
npx vercel                      # follow prompts
# Set env var: NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

#### Step 3 — Deploy to Railway (Python backend, free)
```bash
# In Railway dashboard:
# 1. New Project → Deploy from GitHub
# 2. Add your repo
# 3. Set start command: python api_bridge.py
# 4. Add environment variables (GROQ_API_KEY, etc.)
# 5. Add a volume for /database persistence
```

#### Step 4 — Custom domain (optional, free via Vercel)
```
yourdomain.com → Vercel (frontend)
api.yourdomain.com → Railway (backend)
```

---

## COMPLETE FILE STRUCTURE (Desktop + Web Combined)

```
mailblast-omega/                    ← ROOT REPO
├── main.py                         ← Desktop Python app entry
├── app.py                          ← Desktop app class
├── api_bridge.py                   ← ⭐ FastAPI bridge (NEW)
├── requirements.txt                ← Updated (groq, fastapi, uvicorn added)
├── .env                            ← Updated (GROQ_API_KEY instead of OPENAI/ANTHROPIC)
├── credentials/ ...
├── database/omega.db
├── tracking/server.py, pixel.py, processor.py
├── core/
│   ├── ai_generator.py             ← ⭐ Updated: Groq engine
│   ├── gmail_client.py             ← Updated: token refresh fix (Bug #11)
│   ├── sender.py                   ← Updated: thread-safe progress (Bug #12)
│   ├── outlook_client.py
│   ├── imap_client.py
│   ├── yahoo_client.py
│   ├── rotation_manager.py
│   ├── template_engine.py
│   ├── variable_manager.py
│   ├── scheduler_engine.py
│   ├── open_tracker.py
│   ├── warmup_engine.py
│   ├── bounce_handler.py
│   ├── blacklist_manager.py
│   └── credential_vault.py
├── data/db.py, loader.py
├── utils/logger.py, timezone_utils.py, export_engine.py
├── ui/ ...                         ← All original desktop UI tabs
│
└── mailblast-web/                  ← ⭐ Next.js SaaS web app (NEW)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                ← Landing page
    │   ├── dashboard/page.tsx
    │   ├── compose/page.tsx
    │   ├── ai-studio/page.tsx
    │   ├── analytics/page.tsx
    │   ├── accounts/page.tsx
    │   ├── scheduler/page.tsx
    │   ├── warmup/page.tsx
    │   └── settings/page.tsx
    ├── components/ ...             ← All components spec'd above
    ├── lib/api.ts, hooks/, types.ts
    ├── styles/globals.css
    ├── tailwind.config.ts
    ├── package.json
    └── next.config.ts
```

---

*OMEGA spec is complete — desktop Python app + world-class Next.js SaaS layer. Run locally today, deploy to Vercel + Railway whenever you're ready. Zero paid APIs.*
