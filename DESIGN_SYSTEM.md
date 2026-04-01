# MailBlast Pro — Light Mode Design System
## Source of Truth: Landing Page (`/src/app/page.tsx`)

> This document is the **single reference** for converting every app page from dark mode to the clean, professional light-mode SaaS design established on the landing page. Do not deviate from these rules. Do not touch backend logic, API calls, state management, or component functionality.

---

## 1. Color System

These are the **only** colors used across the entire application. No exceptions.

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#FAFAFA` | Main page background |
| `--bg-alt` | `#F2F3F5` | Section backgrounds, sidebar bg, table headers |
| `--bg-card` | `#FFFFFF` | Cards, panels, modals, dropdowns |
| `--border` | `#D8DADF` | Strong borders (inputs, table rows) |
| `--border-lt` | `#E8E9EC` | Subtle borders (dividers, card edges) |
| `--blue-lt` | `#8BCAF9` | Hover accents, light highlights |
| `--blue` | `#40AAF8` | Secondary brand, chart fills, progress bars |
| `--brand` | `#1297FD` | Primary CTA, active states, links, badges |
| `--brand-dk` | `#0A82E0` | Hover state for brand elements |
| `--green` | `#22C55E` | Success, sent, positive metrics |
| `--green-lt` | `rgba(34,197,94,.1)` | Success badge backgrounds |
| `--red` | `#EF4444` | Error, failed, destructive actions |
| `--amber` | `#F59E0B` | Warning, pending, scheduled states |
| `--text-1` | `#0C0D10` | Primary text — headings, labels, values |
| `--text-2` | `#474A56` | Secondary text — descriptions, subtitles |
| `--text-3` | `#8D909C` | Muted text — placeholders, timestamps, hints |

### Semantic Color Mapping

```
Page background       → #FAFAFA
Sidebar background    → #F2F3F5
Card / Panel          → #FFFFFF
Input background      → #FFFFFF
Table header row      → #F2F3F5
Table row hover       → rgba(18,151,253,.025)
Active nav item bg    → rgba(18,151,253,.07)
Active nav item text  → #1297FD
Inactive nav text     → #8D909C
Border default        → #D8DADF
Border subtle         → #E8E9EC
Border focus          → #1297FD
Primary button        → #1297FD
Primary button hover  → #0A82E0
Secondary button bg   → transparent
Secondary button border → #D8DADF
Heading text          → #0C0D10
Body text             → #474A56
Muted / hint text     → #8D909C
Success               → #22C55E
Error                 → #EF4444
Warning               → #F59E0B
Chart primary         → #1297FD
Chart secondary       → #22C55E
```

### What to Remove Completely

Replace every instance of these dark-mode values:

| Remove | Replace With |
|---|---|
| `#060608` | `#FAFAFA` |
| `#07070D` | `#FAFAFA` |
| `#0A0A0E` | `#F2F3F5` |
| `#0D0D18` | `#F2F3F5` |
| `#12121F` | `#FFFFFF` |
| `#1A1A28` | `#E8E9EC` |
| `#1C1C25` | `#F2F3F5` |
| `#2A2A38` | `#D8DADF` |
| `#303048` | `#8D909C` |
| `#505068` | `#8D909C` |
| `#707088` | `#8D909C` |
| `#E8E8F0` | `#0C0D10` |
| `text-white` | `text-[#0C0D10]` |
| `text-cyan` | `text-[#1297FD]` |
| `bg-cyan` | `bg-[#1297FD]` |
| `bg-[#060608]` | `bg-[#FAFAFA]` |
| `glass-panel` class | See Section 4 — Cards |
| `rgba(255,255,255,0.03)` | `#FFFFFF` |
| `rgba(255,255,255,0.06)` | `#E8E9EC` |
| `rgba(0,229,255,...)` | `rgba(18,151,253,...)` |
| `#00E5FF` | `#1297FD` |
| `#00FFA3` | `#22C55E` |
| `#7B61FF` | `#1297FD` |

---

## 2. Typography System

### Font Stack

```css
--font-head:  'Bricolage Grotesque', sans-serif;   /* Headings, card titles, nav brand */
--font-body:  'Instrument Sans', sans-serif;        /* Body text, labels, buttons */
--font-mono:  'Fira Code', monospace;               /* Tags, badges, code, stats, timestamps */
```

Load via Google Fonts (already in landing page):
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

In Tailwind, map these via `tailwind.config.ts`:
```ts
fontFamily: {
  head: ['Bricolage Grotesque', 'sans-serif'],
  body: ['Instrument Sans', 'sans-serif'],
  mono: ['Fira Code', 'monospace'],
}
```

### Type Scale

| Element | Size | Weight | Font | Color |
|---|---|---|---|---|
| Page H1 | `text-2xl` / `text-3xl` | `font-bold` (700) | `font-head` | `text-[#0C0D10]` |
| Section H2 | `text-xl` | `font-bold` (700) | `font-head` | `text-[#0C0D10]` |
| Card title | `text-base` | `font-semibold` (600) | `font-head` | `text-[#0C0D10]` |
| Body text | `text-sm` | `font-normal` (400) | `font-body` | `text-[#474A56]` |
| Label / hint | `text-xs` | `font-medium` (500) | `font-body` | `text-[#8D909C]` |
| Stat value | `text-3xl` | `font-bold` (700) | `font-head` | `text-[#0C0D10]` |
| Badge / tag | `text-[10px]` | `font-bold` (700) | `font-mono` | varies by type |
| Timestamp | `text-xs` | `font-normal` (400) | `font-mono` | `text-[#8D909C]` |
| Button text | `text-sm` | `font-semibold` (600) | `font-body` | depends on variant |
| Nav link | `text-sm` | `font-medium` (500) | `font-body` | `text-[#474A56]` |
| Table header | `text-[10px]` | `font-bold` (700) | `font-mono` | `text-[#8D909C]` |
| Table cell | `text-sm` | `font-normal` (400) | `font-body` | `text-[#474A56]` |

### Letter Spacing & Line Height

```
Headings:       letter-spacing: -0.03em;  line-height: 1.1
Body:           letter-spacing: 0;         line-height: 1.65
Mono badges:    letter-spacing: 0.07em;    text-transform: uppercase
Nav links:      letter-spacing: 0;         line-height: 1.5
```

### Remove These Typography Patterns

- `tracking-tighter` on headings → replace with `tracking-tight` or `-0.03em`
- `uppercase tracking-widest` on headings → remove uppercase from H1/H2, keep only on badges/tags
- `font-mono` on page headings → switch to `font-head`
- `text-white` → `text-[#0C0D10]`
- `text-[#E8E8F0]` → `text-[#0C0D10]`
- `text-[#707088]` → `text-[#8D909C]`
- `text-[#505068]` → `text-[#8D909C]`

---

## 3. Layout & Spacing Rules

### Page Structure

```
Sidebar width (expanded):  260px
Sidebar width (collapsed):  72px
Main content margin-left:  260px (expanded) / 72px (collapsed)
Page padding:              p-8 xl:p-12 (32px / 48px)
Max content width:         max-w-[1600px]
Section spacing:           space-y-8 (32px between sections)
```

### Grid System

```
Stats row:        grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6
Two-column:       grid-cols-1 lg:grid-cols-2                  gap-6 lg:gap-8
Three-column:     grid-cols-1 md:grid-cols-3                  gap-6
Bento (features): grid-cols-1 lg:grid-cols-2                  gap-5
```

### Spacing Scale (use consistently)

| Token | Value | Use |
|---|---|---|
| `gap-2` | 8px | Inline icon + text |
| `gap-3` | 12px | Badge elements |
| `gap-4` | 16px | Form field groups |
| `gap-5` | 20px | Card grid |
| `gap-6` | 24px | Section grid |
| `gap-8` | 32px | Major layout sections |
| `p-4` | 16px | Compact card padding |
| `p-6` | 24px | Standard card padding |
| `p-8` | 32px | Large card / panel padding |
| `mb-2` | 8px | Label → input |
| `mb-4` | 16px | Input → next field |
| `mb-6` | 24px | Form section → next |
| `mb-8` | 32px | Page section → next |

### Rules

- No element should touch the page edge — minimum `p-4` on all sides
- Cards must have at least `p-6` internal padding
- Tables must have `px-4 py-3` on cells minimum
- Sidebar nav items: `px-3 py-2.5`
- Page header section: always `mb-8` before content begins
- No `min-h-screen` on inner content divs — only on layout wrappers

---

## 4. Component Design System

### 4.1 Cards / Panels

Replace all `glass-panel` usage with this:

```tsx
// Standard card
className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm"

// Elevated card (hover-able)
className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm 
           hover:border-[#8BCAF9] hover:shadow-md transition-all duration-200"

// Section panel (replaces glass-panel)
className="bg-white border border-[#E8E9EC] rounded-2xl p-6"

// Stat card
className="bg-white border border-[#E8E9EC] rounded-xl p-6 shadow-sm"

// Page header bar
className="bg-white border border-[#E8E9EC] rounded-2xl p-6 mb-8"
```

**Remove:**
- `backdrop-filter: blur(...)` — no glassmorphism
- `bg-[#0A0A0E]`, `bg-[#1C1C25]` — all dark backgrounds
- `shadow-xl`, `shadow-[0_0_...]` glow shadows — use `shadow-sm` or `shadow-md` only
- `border-[#1A1A28]` → `border-[#E8E9EC]`

### 4.2 Buttons

```tsx
// Primary (CTA)
className="bg-[#1297FD] text-white font-semibold text-sm px-5 py-2.5 rounded-lg 
           hover:bg-[#0A82E0] transition-colors duration-200 shadow-sm
           hover:shadow-[0_4px_12px_rgba(18,151,253,.25)]"

// Primary pill (landing-style, for page CTAs)
className="bg-[#1297FD] text-white font-semibold text-sm px-5 py-2.5 rounded-full 
           hover:bg-[#0A82E0] transition-all duration-200
           shadow-[0_2px_12px_rgba(18,151,253,.32)]"

// Secondary / outline
className="bg-transparent text-[#1297FD] font-semibold text-sm px-5 py-2.5 rounded-lg 
           border border-[#1297FD] hover:bg-[rgba(18,151,253,.05)] transition-colors duration-200"

// Ghost / subtle
className="bg-transparent text-[#474A56] font-medium text-sm px-4 py-2 rounded-lg 
           hover:bg-[#F2F3F5] hover:text-[#0C0D10] transition-colors duration-200"

// Destructive
className="bg-transparent text-[#EF4444] font-medium text-sm px-4 py-2 rounded-lg 
           hover:bg-[rgba(239,68,68,.06)] transition-colors duration-200"

// Icon button
className="p-2 rounded-lg text-[#8D909C] hover:text-[#0C0D10] 
           hover:bg-[#F2F3F5] transition-colors duration-200"
```

**Remove:**
- `bg-cyan text-black` → use `bg-[#1297FD] text-white`
- `shadow-[0_0_15px_rgba(0,229,255,0.3)]` → use `shadow-sm`
- `hover:bg-cyanDim` → use `hover:bg-[#0A82E0]`
- `border-[#2A2A38]` → use `border-[#D8DADF]`

### 4.3 Inputs & Form Fields

```tsx
// Text input
className="w-full bg-white border border-[#D8DADF] rounded-lg px-4 py-2.5 text-sm 
           text-[#0C0D10] placeholder:text-[#8D909C]
           focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)]
           transition-colors duration-200"

// Textarea
className="w-full bg-white border border-[#D8DADF] rounded-lg px-4 py-3 text-sm 
           text-[#0C0D10] placeholder:text-[#8D909C] resize-none
           focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)]
           transition-colors duration-200"

// Select / Dropdown
className="w-full bg-white border border-[#D8DADF] rounded-lg px-4 py-2.5 text-sm 
           text-[#0C0D10] appearance-none cursor-pointer
           focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)]"

// Input label
className="block text-xs font-medium text-[#474A56] mb-1.5"

// Input error state
className="border-[#EF4444] focus:border-[#EF4444] focus:ring-[rgba(239,68,68,.12)]"

// Error message
className="text-xs text-[#EF4444] mt-1"
```

**Remove:**
- `bg-[#060608]`, `bg-[#0A0A0E]` on inputs → `bg-white`
- `border-[#1A1A28]` → `border-[#D8DADF]`
- `text-[#E8E8F0]` → `text-[#0C0D10]`
- `placeholder:text-[#505068]` → `placeholder:text-[#8D909C]`

### 4.4 Tables

```tsx
// Table wrapper
className="bg-white border border-[#E8E9EC] rounded-2xl overflow-hidden"

// Table header row
className="bg-[#F2F3F5] border-b border-[#E8E9EC]"

// Table header cell
className="px-4 py-3 text-[10px] font-bold font-mono text-[#8D909C] uppercase tracking-wider text-left"

// Table body row
className="border-b border-[#E8E9EC] hover:bg-[rgba(18,151,253,.025)] transition-colors cursor-pointer"

// Table body cell
className="px-4 py-4 text-sm text-[#474A56]"

// Table cell — primary value
className="px-4 py-4 text-sm font-semibold text-[#0C0D10]"

// Divider between rows
className="divide-y divide-[#E8E9EC]"
```

**Remove:**
- `divide-[#1A1A28]` → `divide-[#E8E9EC]`
- `border-[#1A1A28]` → `border-[#E8E9EC]`
- `hover:bg-white/5` → `hover:bg-[rgba(18,151,253,.025)]`
- `text-[#E8E8F0]` on cells → `text-[#0C0D10]`

### 4.5 Badges & Status Tags

```tsx
// Live / Active / Success
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase
           bg-[rgba(34,197,94,.1)] text-[#15803D] border border-[rgba(34,197,94,.18)]"

// Queued / Pending / Scheduled
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase
           bg-[rgba(18,151,253,.1)] text-[#1297FD] border border-[rgba(18,151,253,.18)]"

// Failed / Error
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase
           bg-[rgba(239,68,68,.08)] text-[#DC2626] border border-[rgba(239,68,68,.15)]"

// Warning / Amber
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase
           bg-[rgba(245,158,11,.08)] text-[#B45309] border border-[rgba(245,158,11,.18)]"

// Neutral / Done
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase
           bg-[rgba(141,144,156,.1)] text-[#8D909C] border border-[rgba(141,144,156,.18)]"

// Feature tag (mono label)
className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider
           bg-[rgba(18,151,253,.07)] text-[#1297FD] border border-[rgba(18,151,253,.14)]"
```

### 4.6 Tabs / Range Selectors

```tsx
// Tab container
className="flex bg-[#F2F3F5] p-1 rounded-xl border border-[#E8E9EC]"

// Active tab
className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#0C0D10] 
           shadow-sm border border-[#E8E9EC] transition-all"

// Inactive tab
className="px-4 py-2 rounded-lg text-sm font-medium text-[#8D909C] 
           hover:text-[#474A56] transition-colors"
```

**Remove:**
- `bg-[#060608]` tab container → `bg-[#F2F3F5]`
- `bg-cyan text-black` active tab → `bg-white text-[#0C0D10]`
- `shadow-[0_0_15px_rgba(0,229,255,0.3)]` → `shadow-sm`
- `text-[#505068] hover:text-white` → `text-[#8D909C] hover:text-[#474A56]`

### 4.7 Modals

```tsx
// Overlay
className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"

// Modal box
className="bg-white border border-[#E8E9EC] rounded-2xl p-8 shadow-lg max-w-md w-full mx-4"

// Modal title
className="text-lg font-bold font-head text-[#0C0D10] mb-2"

// Modal body text
className="text-sm text-[#474A56] mb-6"

// Modal footer
className="flex gap-3 justify-end"
```

### 4.8 Stat Cards

Replace `StatCard` component internals:

```tsx
// Card wrapper
className="bg-white border border-[#E8E9EC] rounded-xl p-6 shadow-sm relative overflow-hidden"

// Title
className="text-[10px] font-bold font-mono text-[#8D909C] uppercase tracking-wider mb-3"

// Value — use inline style for color (keep dynamic color prop)
className="text-3xl font-bold font-head tracking-tight"
style={{ color }}   // keep this — it's dynamic per card

// Description
className="text-[10px] font-mono text-[#8D909C] mt-2 uppercase tracking-wider"
```

### 4.9 Empty States

```tsx
// Empty state wrapper
className="py-20 text-center border border-dashed border-[#D8DADF] rounded-2xl 
           flex flex-col items-center gap-4"

// Icon container
className="w-16 h-16 rounded-full bg-[#F2F3F5] flex items-center justify-center text-[#D8DADF]"

// Primary message
className="font-semibold text-[#474A56]"

// Secondary message
className="text-sm text-[#8D909C]"
```

### 4.10 Loading States

```tsx
// Loading text
className="text-sm font-mono text-[#8D909C] animate-pulse"

// Loading spinner color
className="text-[#1297FD] animate-spin"

// Skeleton block
className="bg-[#F2F3F5] rounded-lg animate-pulse"
```

---

## 5. Sidebar — Full Conversion

The sidebar is the most globally impactful component. Convert `Sidebar.tsx` as follows:

### Background & Structure

```tsx
// Sidebar container
className={`${sidebarWidth} h-screen bg-[#F2F3F5] border-r border-[#E8E9EC] flex flex-col fixed left-0 top-0 z-[60]
  transition-all duration-300 ease-in-out
  ${isMobile ? (isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full') : 'translate-x-0'}`}
```

### Header

```tsx
// Header wrapper
className="p-5 border-b border-[#E8E9EC] flex items-center justify-between min-h-[72px]"

// Brand name
className="text-lg font-bold font-head text-[#0C0D10]"

// Brand subtitle
className="text-[10px] text-[#8D909C] mt-0.5 font-mono tracking-widest"

// Logo gem (matches landing page)
// width:32px height:32px border-radius:9px background:#1297FD
// box-shadow: 0 2px 10px rgba(18,151,253,.35)
```

### Nav Links

```tsx
// Active link indicator bar
className="absolute left-0 top-0 w-1 h-full bg-[#1297FD] rounded-r-full"

// Active link row
className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[rgba(18,151,253,.07)] text-[#1297FD]"

// Inactive link row
className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#8D909C] 
           hover:bg-white hover:text-[#0C0D10] transition-all duration-200"

// Icon (active)
className="flex-shrink-0 text-[#1297FD]"

// Icon (inactive)
className="flex-shrink-0"   // inherits text color from parent

// Link text
className="font-medium text-sm whitespace-nowrap"
```

### Mobile Hamburger Button

```tsx
className="fixed top-4 left-4 z-[60] p-2.5 bg-white border border-[#E8E9EC] rounded-xl 
           text-[#1297FD] shadow-sm hover:bg-[#F2F3F5] transition-all active:scale-95"
```

### Mobile Overlay

```tsx
className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity"
```

### Collapse Toggle Button

```tsx
className="p-1.5 rounded-lg hover:bg-white text-[#8D909C] hover:text-[#1297FD] transition-colors"
```

### Tooltip (collapsed state)

```tsx
className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 
           bg-white border border-[#E8E9EC] rounded-md text-xs text-[#0C0D10] 
           whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none 
           transition-opacity z-[70] shadow-md"
```

---

## 6. Page-Level Conversion Guide

### 6.1 Layout Wrapper (`AppLayoutWrapper.tsx`)

```tsx
// InnerLayout main wrapper — no change needed to logic
// Only update body background in layout.tsx:

// layout.tsx body className:
className={`${inter.variable} ${jetbrains.variable} bg-[#FAFAFA] text-[#0C0D10] antialiased min-h-screen`}
```

Also update `globals.css`:
```css
:root {
  --background: #FAFAFA;
  --foreground: #0C0D10;
}
body {
  background-color: var(--background);
  color: var(--foreground);
}
::-webkit-scrollbar-track { background: #F2F3F5; }
::-webkit-scrollbar-thumb { background: #D8DADF; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #8D909C; }
```

---

### 6.2 Dashboard (`/dashboard/page.tsx`)

**Page header bar:**
```tsx
className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between 
           bg-white p-4 lg:p-6 rounded-2xl border border-[#E8E9EC] mb-8"
```

**H1:**
```tsx
className="text-2xl lg:text-3xl font-bold font-head text-[#0C0D10] flex items-center gap-3"
// Icon: className="text-[#1297FD]"
```

**Subtitle:**
```tsx
className="text-[#8D909C] mt-1 font-mono text-sm"
```

**Range selector tabs:** → See Section 4.6

**Main chart panel:**
```tsx
className="bg-white border border-[#E8E9EC] rounded-2xl p-8 relative overflow-hidden flex flex-col min-h-[500px]"
```

**Chart config updates:**
```tsx
// XAxis / YAxis stroke
stroke="#E8E9EC"

// Tooltip
contentStyle={{ 
  backgroundColor: '#FFFFFF', 
  border: '1px solid #E8E9EC', 
  borderRadius: '12px', 
  fontFamily: 'monospace',
  color: '#0C0D10'
}}
itemStyle={{ color: '#1297FD', fontSize: '12px' }}
labelStyle={{ color: '#8D909C', fontSize: '10px', marginBottom: '4px' }}
cursor={{ fill: 'rgba(18,151,253,.03)' }}

// Bar gradient
<stop offset="0%" stopColor="#1297FD" stopOpacity={1}/>
<stop offset="100%" stopColor="#1297FD" stopOpacity={0.2}/>

// CartesianGrid
stroke="#E8E9EC"
```

**Recent activity panel:**
```tsx
className="bg-white border border-[#E8E9EC] rounded-2xl p-6 flex-1"
```

**Section label:**
```tsx
className="font-mono text-xs font-bold text-[#0C0D10] mb-6 uppercase tracking-wider flex items-center justify-between"
// Icon: className="text-[#F59E0B]"
```

**"View All" link:**
```tsx
className="text-[10px] text-[#1297FD] hover:underline transition-colors uppercase tracking-wider font-bold"
```

**Table row hover:**
```tsx
className="group hover:bg-[rgba(18,151,253,.025)] transition-colors cursor-pointer"
```

**Campaign name in table:**
```tsx
className="font-semibold text-[#0C0D10] group-hover:text-[#1297FD] transition-colors truncate"
```

**Sent count:**
```tsx
className="font-mono text-[#1297FD]/80"
```

**Open rate:**
```tsx
className="text-right font-mono text-[#22C55E] tabular-nums"
```

---

### 6.3 Composer (`/composer/page.tsx`)

**Page header:**
```tsx
<h1 className="text-2xl font-bold font-head text-[#0C0D10]">Campaign Composer</h1>
<p className="text-sm text-[#8D909C] mt-1">Draft, preview, configure, and launch mass blasts seamlessly.</p>
```

**Campaign progress view — wrapper:**
```tsx
className="bg-white border border-[#E8E9EC] rounded-2xl p-10 text-center"
```

**Progress bar track:**
```tsx
className="w-full h-3 bg-[#F2F3F5] rounded-full overflow-hidden mb-8 border border-[#E8E9EC]"
```

**Progress bar fill (running):**
```tsx
className="h-full bg-[#1297FD] rounded-full transition-all duration-500"
```

**Progress bar fill (completed):**
```tsx
className="h-full bg-[#22C55E] rounded-full"
```

**Stat boxes (Total / Sent / Failed / Pending):**
```tsx
// Wrapper
className="bg-[#F2F3F5] p-6 rounded-xl border border-[#E8E9EC]"

// Total label
className="text-[#8D909C] text-xs font-bold font-mono mb-2 flex items-center gap-2 justify-center"

// Sent value
className="text-3xl font-bold font-head text-[#22C55E]"

// Failed value
className="text-3xl font-bold font-head text-[#EF4444]"

// Pending value
className="text-3xl font-bold font-head text-[#F59E0B]"

// Total value
className="text-3xl font-bold font-head text-[#0C0D10]"
```

**Live log terminal:**
```tsx
className="p-4 h-[280px] overflow-y-auto space-y-2 font-mono text-xs text-left 
           bg-[#F2F3F5] border border-[#E8E9EC] rounded-xl"
```

**Log row:**
```tsx
className="flex justify-between items-center p-2 border-b border-[#E8E9EC]"
// Sent: className="text-[#22C55E]"
// Failed: className="text-[#EF4444]"
// Timestamp: className="text-[#8D909C]"
```

**"New Campaign" button:**
```tsx
className="mt-8 px-8 py-3 rounded-lg border border-[#D8DADF] hover:bg-[#F2F3F5] 
           text-[#474A56] font-semibold transition-colors"
```

---

### 6.4 Scheduler (`/scheduler/page.tsx`)

**Page header:**
```tsx
<h1 className="text-2xl font-bold font-head text-[#0C0D10]">Scheduler</h1>
<p className="text-sm text-[#8D909C] mt-1">Precision-timed dispatch control for campaigns and single hits.</p>
```

**Add Scheduler button:** → Primary button (Section 4.2)

**Panel wrapper:**
```tsx
className="bg-white border border-[#E8E9EC] rounded-2xl p-6"
```

**Panel label:**
```tsx
className="font-mono text-[#1297FD] flex items-center gap-2 mb-6 uppercase tracking-wider text-xs font-bold"
```

**Table:** → See Section 4.4

**Campaign type badge (bulk):**
```tsx
className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border
           bg-[rgba(18,151,253,.1)] text-[#1297FD] border-[rgba(18,151,253,.2)]"
```

**Campaign type badge (single):**
```tsx
className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border
           bg-[rgba(168,85,247,.08)] text-[#7C3AED] border-[rgba(168,85,247,.2)]"
```

**Scheduled time:**
```tsx
className="flex items-center gap-2 text-[#F59E0B] font-mono text-xs"
```

**Delete button:** → Destructive icon button (Section 4.2)

**Back link:**
```tsx
className="text-[#8D909C] hover:text-[#0C0D10] transition-colors flex items-center gap-1 text-sm font-medium"
```

**Divider:**
```tsx
className="h-4 w-px bg-[#E8E9EC]"
```

**"New Scheduled Dispatch" label:**
```tsx
className="text-xs font-mono text-[#1297FD] uppercase tracking-wider font-bold"
```

---

### 6.5 Analytics (`/analytics/page.tsx`)

**Page header:**
```tsx
<h1 className="text-2xl font-bold font-head text-[#0C0D10] flex items-center gap-3">
  <BarChart3 className="text-[#1297FD]" /> Analytics
</h1>
<p className="text-sm text-[#8D909C] mt-1 font-mono uppercase tracking-wider">Performance & Historical Trends</p>
```

**Header border:**
```tsx
className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E8E9EC] pb-6 mb-8"
```

**Chart panel:**
```tsx
className="bg-white border border-[#E8E9EC] rounded-2xl p-8 flex flex-col"
```

**Chart panel header:**
```tsx
className="flex items-center justify-between mb-8 border-b border-[#E8E9EC] pb-4"
```

**Chart title:**
```tsx
className="font-head text-lg font-bold text-[#0C0D10]"
```

**Chart subtitle:**
```tsx
className="text-xs text-[#8D909C] font-mono mt-1"
```

**Legend dots:**
```tsx
// Sent
className="flex items-center gap-2 text-[10px] font-mono text-[#1297FD]"
<div className="w-2 h-2 rounded-full bg-[#1297FD]" />

// Opens
className="flex items-center gap-2 text-[10px] font-mono text-[#22C55E]"
<div className="w-2 h-2 rounded-full bg-[#22C55E]" />
```

**Chart config:**
```tsx
CartesianGrid: stroke="#E8E9EC"
XAxis/YAxis: stroke="#E8E9EC", tick color "#8D909C"
Tooltip: same as Dashboard (Section 6.2)

// Sent gradient
<stop offset="5%" stopColor="#1297FD" stopOpacity={0.8}/>
<stop offset="95%" stopColor="#1297FD" stopOpacity={0.15}/>

// Opens gradient
<stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
<stop offset="95%" stopColor="#22C55E" stopOpacity={0.15}/>
```

---

### 6.6 All Other Pages (Templates, Accounts, Warmup, Sent, Blacklist, Settings, AI Studio)

Apply the same pattern universally:

1. Page wrapper: `className="space-y-8 pb-20"`
2. Page header: `bg-white border border-[#E8E9EC] rounded-2xl p-6 mb-8`
3. H1: `font-head font-bold text-[#0C0D10]`
4. Subtitle: `text-sm text-[#8D909C] mt-1`
5. All panels: `bg-white border border-[#E8E9EC] rounded-2xl p-6`
6. All tables: Section 4.4
7. All buttons: Section 4.2
8. All inputs: Section 4.3
9. All badges: Section 4.5
10. Empty states: Section 4.9

---

## 7. CampaignEditor Component

`CampaignEditor.tsx` is used in both Composer and Scheduler. Apply these rules:

```tsx
// Outer wrapper
className="bg-white border border-[#E8E9EC] rounded-2xl overflow-hidden"

// Section headers within editor
className="bg-[#F2F3F5] border-b border-[#E8E9EC] px-6 py-4"
className="text-sm font-semibold font-head text-[#0C0D10]"

// All inputs → Section 4.3
// All buttons → Section 4.2
// File upload zone
className="border-2 border-dashed border-[#D8DADF] rounded-xl p-8 text-center 
           hover:border-[#1297FD] hover:bg-[rgba(18,151,253,.025)] transition-all cursor-pointer"

// File upload text
className="text-sm text-[#8D909C]"
className="text-xs text-[#1297FD] font-medium mt-1"
```

---

## 8. Recharts Global Config

Every chart across the app must use these settings:

```tsx
// Tooltip
contentStyle={{
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8E9EC',
  borderRadius: '12px',
  fontFamily: 'monospace',
  fontSize: '12px',
  color: '#0C0D10',
  boxShadow: '0 4px 20px rgba(0,0,0,.08)'
}}
itemStyle={{ fontSize: '12px' }}
labelStyle={{ color: '#8D909C', fontSize: '10px', marginBottom: '4px' }}
cursor={{ fill: 'rgba(18,151,253,.03)' }}

// Axes
stroke="#E8E9EC"
fontSize={10}
tickLine={false}
axisLine={false}
tick={{ fill: '#8D909C' }}

// Grid
stroke="#E8E9EC"
strokeDasharray="3 3"
vertical={false}

// Primary bar/line color: #1297FD
// Secondary bar/line color: #22C55E
// Tertiary: #F59E0B
```

---

## 9. Interaction & Animation Rules

### Transitions

```css
/* Standard hover transition */
transition: all 0.2s ease;

/* Color-only transition */
transition: color 0.2s, background-color 0.2s, border-color 0.2s;

/* Shadow transition */
transition: box-shadow 0.2s, transform 0.2s;
```

In Tailwind: always use `transition-colors duration-200` or `transition-all duration-200`.

### Hover Effects

| Element | Hover Behavior |
|---|---|
| Card | `hover:border-[#8BCAF9] hover:shadow-md` |
| Nav link | `hover:bg-white hover:text-[#0C0D10]` |
| Table row | `hover:bg-[rgba(18,151,253,.025)]` |
| Primary button | `hover:bg-[#0A82E0] hover:-translate-y-px` |
| Ghost button | `hover:bg-[#F2F3F5]` |
| Icon button | `hover:bg-[#F2F3F5] hover:text-[#0C0D10]` |
| Input | `hover:border-[#8BCAF9]` |
| Link | `hover:text-[#1297FD]` |

### Focus States

```tsx
// All interactive elements
focus:outline-none focus:ring-2 focus:ring-[rgba(18,151,253,.2)] focus:ring-offset-1

// Inputs specifically
focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)]
```

### Framer Motion — Keep But Lighten

Keep all existing `motion.div` animations. Only update the color values inside them. Do not remove animations.

```tsx
// Standard fade-up (keep as-is)
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}

// No glow pulses
// No scale bounces beyond 1.02
// No color-changing animations
```

### What to Remove

- `animate-pulse` on text (keep only on loading indicators)
- `shadow-[0_0_15px_rgba(0,229,255,...)]` glow shadows — remove entirely
- `shadow-[0_0_...]` any neon glow — remove entirely
- `box-shadow: 0 0 ...` cyan/emerald glows — remove entirely
- `@keyframes heroPulse` style pulsing glows — remove

---

## 10. What to Avoid — Hard Rules

| ❌ Never Use | ✅ Use Instead |
|---|---|
| Neon/glow box-shadows | `shadow-sm`, `shadow-md` |
| Glassmorphism (`backdrop-blur` on cards) | Solid `bg-white` |
| Dark backgrounds anywhere in app | `#FAFAFA`, `#F2F3F5`, `#FFFFFF` |
| `text-white` in app pages | `text-[#0C0D10]` |
| `bg-cyan` | `bg-[#1297FD]` |
| `text-cyan` | `text-[#1297FD]` |
| Gradient text (`-webkit-text-fill-color`) | Solid color text |
| `uppercase tracking-widest` on H1/H2 | Only on mono badges/tags |
| `font-mono` on page headings | `font-head` |
| Mixed dark + light elements | Consistent light everywhere |
| Random inline `style={{ color: '#00E5FF' }}` | Use design token colors |
| `rgba(255,255,255,0.03)` backgrounds | `#FFFFFF` or `#F2F3F5` |
| `border-white/10` | `border-[#E8E9EC]` |
| Orb/blob background decorations | Clean flat background |
| Grid overlay patterns | None |

---

## 11. Tailwind Config Updates

Update `tailwind.config.ts` to add design tokens:

```ts
theme: {
  extend: {
    colors: {
      bg: '#FAFAFA',
      'bg-alt': '#F2F3F5',
      'bg-card': '#FFFFFF',
      border: '#D8DADF',
      'border-lt': '#E8E9EC',
      'blue-lt': '#8BCAF9',
      blue: '#40AAF8',
      brand: '#1297FD',
      'brand-dk': '#0A82E0',
      // Keep existing for any remaining references:
      cyan: '#1297FD',       // remapped from #00E5FF
      emerald: '#22C55E',    // remapped from #00FFA3
    },
    fontFamily: {
      head: ['Bricolage Grotesque', 'sans-serif'],
      body: ['Instrument Sans', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },
    borderRadius: {
      '2xl': '16px',
      '3xl': '20px',
      '4xl': '28px',
    },
    boxShadow: {
      sm: '0 1px 4px rgba(0,0,0,.06)',
      md: '0 4px 20px rgba(0,0,0,.08)',
      lg: '0 12px 48px rgba(0,0,0,.1)',
      brand: '0 2px 12px rgba(18,151,253,.32)',
      'brand-lg': '0 4px 20px rgba(18,151,253,.35)',
    }
  }
}
```

---

## 12. Conversion Checklist

Use this checklist when converting each page:

### Per-Page Checklist

- [ ] Page background → `bg-[#FAFAFA]`
- [ ] All panels/cards → `bg-white border border-[#E8E9EC] rounded-2xl`
- [ ] `glass-panel` class removed → replaced with card styles
- [ ] H1 → `font-head font-bold text-[#0C0D10]`
- [ ] Subtitle → `text-sm text-[#8D909C]`
- [ ] All `text-white` → `text-[#0C0D10]`
- [ ] All `text-[#E8E8F0]` → `text-[#0C0D10]`
- [ ] All `text-[#707088]` / `text-[#505068]` → `text-[#8D909C]`
- [ ] All `border-[#1A1A28]` → `border-[#E8E9EC]`
- [ ] All `bg-[#060608]` / `bg-[#0A0A0E]` / `bg-[#1C1C25]` → appropriate light bg
- [ ] `bg-cyan text-black` buttons → `bg-[#1297FD] text-white`
- [ ] `text-cyan` → `text-[#1297FD]`
- [ ] Glow shadows removed
- [ ] Chart colors updated (Section 8)
- [ ] Inputs updated (Section 4.3)
- [ ] Badges updated (Section 4.5)
- [ ] Tabs updated (Section 4.6)
- [ ] Empty states updated (Section 4.9)
- [ ] No mixed dark/light elements remain

### Global Checklist

- [ ] `globals.css` updated (Section 6.1)
- [ ] `layout.tsx` body class updated (Section 6.1)
- [ ] `Sidebar.tsx` fully converted (Section 5)
- [ ] `StatCard.tsx` updated (Section 4.8)
- [ ] `tailwind.config.ts` updated (Section 11)
- [ ] Google Fonts loaded in `layout.tsx` `<head>`
- [ ] No `glass-panel` class references remain
- [ ] No `#00E5FF` / `#00FFA3` / `#7B61FF` colors remain
- [ ] No dark scrollbar styles remain

---

## 13. Quick Reference — Most Common Replacements

```
bg-[#060608]          →  bg-[#FAFAFA]
bg-[#0A0A0E]          →  bg-[#F2F3F5]
bg-[#1C1C25]          →  bg-[#F2F3F5]
bg-[#12121F]          →  bg-white
border-[#1A1A28]      →  border-[#E8E9EC]
border-[#2A2A38]      →  border-[#D8DADF]
text-white            →  text-[#0C0D10]
text-[#E8E8F0]        →  text-[#0C0D10]
text-[#707088]        →  text-[#8D909C]
text-[#505068]        →  text-[#8D909C]
text-[#303048]        →  text-[#8D909C]
text-cyan             →  text-[#1297FD]
bg-cyan               →  bg-[#1297FD]
border-cyan           →  border-[#1297FD]
divide-[#1A1A28]      →  divide-[#E8E9EC]
hover:bg-white/5      →  hover:bg-[rgba(18,151,253,.025)]
hover:text-white      →  hover:text-[#0C0D10]
glass-panel           →  bg-white border border-[#E8E9EC] rounded-2xl p-6
shadow-[0_0_15px_...] →  shadow-sm
font-mono (headings)  →  font-head
uppercase tracking-widest (H1) → remove
```

---

*Last updated: Based on landing page design system — `/src/app/page.tsx`*
*Do not modify backend logic, API calls, state, or component structure.*
*This document covers UI/UX styling only.*
