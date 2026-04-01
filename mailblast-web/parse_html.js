const fs = require('fs');

const raw = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MailBlast Pro — Scale Your Cold Outreach</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-base: #07070D;
    --bg-surface: #0D0D18;
    --bg-elevated: #12121F;
    --bg-card: rgba(255,255,255,0.03);
    --border-subtle: rgba(255,255,255,0.06);
    --border-glow: rgba(0,229,255,0.25);
    --cyan: #00E5FF;
    --cyan-dim: rgba(0,229,255,0.12);
    --cyan-mid: rgba(0,229,255,0.35);
    --emerald: #00FFA3;
    --emerald-dim: rgba(0,255,163,0.1);
    --purple: #7B61FF;
    --purple-dim: rgba(123,97,255,0.12);
    --text-primary: #F0F0FA;
    --text-secondary: #8888A8;
    --text-muted: #4A4A6A;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --radius-sm: 8px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-xl: 32px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ─── BACKGROUND CANVAS ─── */
  .bg-canvas {
    position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
  }
  .orb {
    position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.18;
    animation: orbFloat 18s ease-in-out infinite;
  }
  .orb-1 { width: 700px; height: 700px; background: radial-gradient(circle, #00E5FF, transparent 70%); top: -200px; left: -150px; animation-delay: 0s; }
  .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #00FFA3, transparent 70%); top: 30%; right: -100px; animation-delay: -6s; }
  .orb-3 { width: 600px; height: 600px; background: radial-gradient(circle, #7B61FF, transparent 70%); bottom: 10%; left: 20%; animation-delay: -12s; }
  .orb-4 { width: 400px; height: 400px; background: radial-gradient(circle, #00E5FF, transparent 70%); bottom: -100px; right: 15%; animation-delay: -4s; }
  @keyframes orbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(40px, -60px) scale(1.08); }
    66% { transform: translate(-30px, 40px) scale(0.94); }
  }

  /* noise grain overlay */
  .bg-canvas::after {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.025; mix-blend-mode: overlay;
  }

  /* grid lines */
  .grid-overlay {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 80px 80px;
  }

  /* ─── LAYOUT HELPERS ─── */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; position: relative; z-index: 1; }
  section { position: relative; z-index: 1; }

  /* ─── NAVIGATION ─── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 18px 0;
    background: rgba(7,7,13,0.7);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--border-subtle);
    transition: all 0.3s ease;
  }
  nav.scrolled { padding: 12px 0; background: rgba(7,7,13,0.88); }
  .nav-inner { display: flex; align-items: center; justify-content: space-between; }

  .logo {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-weight: 800; font-size: 1.2rem;
    color: var(--text-primary); text-decoration: none; letter-spacing: -0.02em;
  }
  .logo-icon {
    width: 34px; height: 34px; position: relative;
    background: linear-gradient(135deg, #00E5FF22, #7B61FF22);
    border: 1px solid rgba(0,229,255,0.3);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(0,229,255,0.15);
  }
  .logo-icon svg { width: 18px; height: 18px; }

  .nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
  .nav-links a {
    color: var(--text-secondary); text-decoration: none; font-size: 0.875rem; font-weight: 400;
    transition: color 0.2s; letter-spacing: 0.01em;
  }
  .nav-links a:hover { color: var(--text-primary); }

  .nav-actions { display: flex; align-items: center; gap: 16px; }
  .btn-ghost {
    background: none; border: none; color: var(--text-secondary);
    font-size: 0.875rem; cursor: pointer; font-family: var(--font-body);
    transition: color 0.2s; text-decoration: none; padding: 6px 0;
  }
  .btn-ghost:hover { color: var(--text-primary); }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px; border-radius: 100px;
    background: linear-gradient(135deg, #00E5FF, #00B8CC);
    color: #07070D; font-weight: 600; font-size: 0.875rem;
    border: none; cursor: pointer; text-decoration: none;
    font-family: var(--font-body); letter-spacing: 0.01em;
    box-shadow: 0 0 24px rgba(0,229,255,0.35), 0 4px 12px rgba(0,0,0,0.4);
    transition: all 0.25s ease; position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, #00FFA3, #00E5FF);
    opacity: 0; transition: opacity 0.25s;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 40px rgba(0,229,255,0.5), 0 8px 20px rgba(0,0,0,0.4); }
  .btn-primary:hover::before { opacity: 1; }
  .btn-primary span { position: relative; z-index: 1; }

  /* ─── HERO ─── */
  .hero {
    min-height: 100vh; display: flex; align-items: center;
    padding: 120px 0 80px;
  }
  .hero-inner {
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
  }

  .badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 14px; border-radius: 100px;
    background: rgba(0,229,255,0.07); border: 1px solid rgba(0,229,255,0.2);
    font-family: var(--font-mono); font-size: 0.72rem; color: var(--cyan);
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 28px;
    animation: fadeUp 0.8s ease both;
  }
  .badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--cyan);
    box-shadow: 0 0 8px var(--cyan); animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); } }

  .hero-h1 {
    font-family: var(--font-display); font-weight: 800;
    font-size: clamp(2.6rem, 5vw, 3.8rem); line-height: 1.08;
    letter-spacing: -0.035em; margin-bottom: 24px;
    animation: fadeUp 0.8s 0.1s ease both;
  }
  .hero-h1 .accent-cyan { color: var(--cyan); }
  .hero-h1 .accent-emerald { color: var(--emerald); }

  .hero-sub {
    font-size: 1.05rem; color: var(--text-secondary); line-height: 1.7;
    max-width: 480px; margin-bottom: 40px;
    animation: fadeUp 0.8s 0.2s ease both;
  }

  .hero-actions {
    display: flex; align-items: center; gap: 20px;
    animation: fadeUp 0.8s 0.3s ease both;
  }
  .btn-hero {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 32px; border-radius: 100px;
    background: linear-gradient(135deg, #00E5FF, #00C2D4);
    color: #07070D; font-weight: 700; font-size: 1rem;
    border: none; cursor: pointer; text-decoration: none;
    font-family: var(--font-display); letter-spacing: -0.01em;
    box-shadow: 0 0 40px rgba(0,229,255,0.4), 0 8px 24px rgba(0,0,0,0.4);
    transition: all 0.3s ease; position: relative;
    animation: heroPulse 3s ease-in-out infinite;
  }
  @keyframes heroPulse {
    0%,100% { box-shadow: 0 0 40px rgba(0,229,255,0.4), 0 8px 24px rgba(0,0,0,0.4); }
    50% { box-shadow: 0 0 70px rgba(0,229,255,0.65), 0 8px 28px rgba(0,0,0,0.4); }
  }
  .btn-hero:hover { transform: translateY(-2px) scale(1.02); animation: none; box-shadow: 0 0 80px rgba(0,229,255,0.7), 0 12px 32px rgba(0,0,0,0.4); }

  .hero-social-proof {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.82rem; color: var(--text-muted);
  }
  .avatar-stack { display: flex; }
  .avatar-stack img, .avatar {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid var(--bg-base); margin-left: -8px;
    background: linear-gradient(135deg, #7B61FF, #00E5FF);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: white;
    overflow: hidden;
  }
  .avatar-stack .avatar:first-child { margin-left: 0; }
  .avatar-c { background: linear-gradient(135deg, #00E5FF, #00FFA3); }
  .avatar-b { background: linear-gradient(135deg, #7B61FF, #FF61B0); }
  .avatar-a { background: linear-gradient(135deg, #FF9900, #FF6060); }
  .stars { color: #FFB800; font-size: 11px; letter-spacing: 1px; }

  /* ─── HERO VISUAL ─── */
  .hero-visual {
    position: relative; animation: fadeUp 0.8s 0.25s ease both;
  }
  .dashboard-mock {
    position: relative; border-radius: var(--radius-lg);
    background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 28px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.1);
    transform: perspective(1200px) rotateY(-6deg) rotateX(3deg);
    transition: transform 0.5s ease;
    animation: dashFloat 8s ease-in-out infinite;
  }
  .dashboard-mock:hover { transform: perspective(1200px) rotateY(-2deg) rotateX(1deg); }
  @keyframes dashFloat {
    0%,100% { transform: perspective(1200px) rotateY(-6deg) rotateX(3deg) translateY(0); }
    50% { transform: perspective(1200px) rotateY(-6deg) rotateX(3deg) translateY(-12px); }
  }

  .mock-topbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; padding-bottom: 16px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .mock-dots { display: flex; gap: 6px; }
  .mock-dot { width: 10px; height: 10px; border-radius: 50%; }
  .mock-dot:nth-child(1) { background: #FF5F5A; }
  .mock-dot:nth-child(2) { background: #FFBC2E; }
  .mock-dot:nth-child(3) { background: #27C840; }
  .mock-title { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); }

  .mock-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px; }
  .stat-chip {
    background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm); padding: 12px;
    transition: all 0.3s;
  }
  .stat-chip:hover { border-color: var(--border-glow); background: rgba(0,229,255,0.05); }
  .stat-val { font-family: var(--font-mono); font-size: 1.3rem; font-weight: 600; }
  .stat-val.c { color: var(--cyan); }
  .stat-val.e { color: var(--emerald); }
  .stat-val.p { color: #FFB800; }
  .stat-label { font-size: 0.68rem; color: var(--text-muted); margin-top: 2px; }

  .mock-bar-area { margin-bottom: 16px; }
  .mock-bar-label { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 8px; font-family: var(--font-mono); }
  .bar-rows { display: flex; flex-direction: column; gap: 7px; }
  .bar-row { display: flex; align-items: center; gap: 10px; }
  .bar-name { font-size: 0.68rem; color: var(--text-secondary); width: 60px; text-align: right; }
  .bar-track { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .bar-pct { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); width: 32px; }
  .fill-c { background: linear-gradient(90deg, var(--cyan), #00FFA3); width: 82%; animation: barExpand 1.5s 0.5s ease both; }
  .fill-e { background: linear-gradient(90deg, var(--emerald), #00E5FF); width: 67%; animation: barExpand 1.5s 0.7s ease both; }
  .fill-p { background: linear-gradient(90deg, var(--purple), #FF61B0); width: 91%; animation: barExpand 1.5s 0.9s ease both; }
  @keyframes barExpand { from { width: 0 !important; } }

  .mock-emails { display: flex; flex-direction: column; gap: 7px; }
  .email-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: var(--radius-sm);
    background: rgba(255,255,255,0.025); border: 1px solid var(--border-subtle);
    font-size: 0.72rem; transition: all 0.2s;
  }
  .email-row:hover { background: rgba(0,229,255,0.04); border-color: rgba(0,229,255,0.15); }
  .email-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .email-to { color: var(--text-secondary); flex: 1; }
  .email-status {
    padding: 2px 8px; border-radius: 20px; font-family: var(--font-mono); font-size: 0.6rem;
  }
  .s-sent { background: rgba(0,229,255,0.1); color: var(--cyan); border: 1px solid rgba(0,229,255,0.2); }
  .s-open { background: rgba(0,255,163,0.1); color: var(--emerald); border: 1px solid rgba(0,255,163,0.2); }
  .s-sched { background: rgba(123,97,255,0.1); color: var(--purple); border: 1px solid rgba(123,97,255,0.2); }

  /* floating chips outside the card */
  .float-chip {
    position: absolute; border-radius: var(--radius-md);
    background: rgba(7,7,13,0.85); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 10px 14px; font-size: 0.72rem; white-space: nowrap;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: dashFloat2 6s ease-in-out infinite;
  }
  .float-chip .fc-icon { font-size: 16px; margin-right: 6px; }
  .fc-1 { top: -18px; right: -30px; animation-delay: -2s; }
  .fc-2 { bottom: 40px; left: -40px; animation-delay: -4s; }
  @keyframes dashFloat2 {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ─── SECTION HEADER ─── */
  .section-label {
    display: inline-block; font-family: var(--font-mono); font-size: 0.68rem;
    color: var(--cyan); letter-spacing: 0.12em; text-transform: uppercase;
    margin-bottom: 14px; opacity: 0.8;
  }
  .section-h2 {
    font-family: var(--font-display); font-weight: 800;
    font-size: clamp(2rem, 3.5vw, 3rem); letter-spacing: -0.03em; line-height: 1.1;
    margin-bottom: 16px;
  }
  .section-sub { font-size: 1.05rem; color: var(--text-secondary); max-width: 540px; line-height: 1.7; }

  /* ─── BENTO GRID ─── */
  #features { padding: 120px 0; }
  .bento-header { text-align: center; margin-bottom: 64px; }
  .bento-header .section-sub { margin: 0 auto; }

  .bento-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 18px;
  }

  .bento-card {
    background: var(--bg-card); backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);
    padding: 36px; position: relative; overflow: hidden;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    cursor: default;
  }
  .bento-card::before {
    content: ''; position: absolute; inset: 0; opacity: 0;
    background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,229,255,0.06), transparent 40%);
    transition: opacity 0.4s;
  }
  .bento-card:hover { border-color: rgba(0,229,255,0.2); transform: translateY(-3px); box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,229,255,0.08); }
  .bento-card:hover::before { opacity: 1; }

  .bento-card.wide { grid-column: span 2; }
  .bento-card.tall { /* normal height */ }

  .bento-icon {
    width: 48px; height: 48px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 22px; font-size: 22px;
  }
  .icon-cyan { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); }
  .icon-emerald { background: rgba(0,255,163,0.1); border: 1px solid rgba(0,255,163,0.2); }
  .icon-purple { background: rgba(123,97,255,0.12); border: 1px solid rgba(123,97,255,0.25); }
  .icon-orange { background: rgba(255,153,0,0.1); border: 1px solid rgba(255,153,0,0.2); }

  .bento-tag {
    display: inline-block; font-family: var(--font-mono); font-size: 0.65rem;
    letter-spacing: 0.1em; padding: 3px 10px; border-radius: 100px;
    margin-bottom: 12px; text-transform: uppercase;
  }
  .tag-cyan { background: rgba(0,229,255,0.08); color: var(--cyan); border: 1px solid rgba(0,229,255,0.15); }
  .tag-emerald { background: rgba(0,255,163,0.08); color: var(--emerald); border: 1px solid rgba(0,255,163,0.15); }
  .tag-purple { background: rgba(123,97,255,0.1); color: var(--purple); border: 1px solid rgba(123,97,255,0.2); }
  .tag-orange { background: rgba(255,153,0,0.08); color: #FFB800; border: 1px solid rgba(255,153,0,0.15); }

  .bento-h3 {
    font-family: var(--font-display); font-weight: 700; font-size: 1.35rem;
    letter-spacing: -0.02em; margin-bottom: 10px; line-height: 1.2;
  }
  .bento-p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; }

  /* bento decorative visuals */
  .bento-visual { margin-top: 28px; }
  .send-animation { display: flex; align-items: center; gap: 0; }
  .send-node {
    width: 10px; height: 10px; border-radius: 50%; background: var(--cyan);
    box-shadow: 0 0 10px var(--cyan); position: relative;
  }
  .send-line {
    flex: 1; height: 2px;
    background: linear-gradient(90deg, var(--cyan-mid), transparent);
    position: relative; overflow: visible;
  }
  .send-packet {
    position: absolute; top: -4px; left: 0;
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--cyan); box-shadow: 0 0 14px var(--cyan);
    animation: packetFly 2s linear infinite;
  }
  .send-targets { display: flex; flex-direction: column; gap: 12px; }
  .target-node {
    width: 8px; height: 8px; border-radius: 50%; background: var(--emerald);
    box-shadow: 0 0 8px var(--emerald);
    animation: targetPulse 2s ease-in-out infinite;
  }
  .target-node:nth-child(2) { animation-delay: 0.4s; background: #FFB800; box-shadow: 0 0 8px #FFB800; }
  .target-node:nth-child(3) { animation-delay: 0.8s; }
  @keyframes packetFly { from { left: 0; opacity: 1; } to { left: calc(100% + 10px); opacity: 0; } }
  @keyframes targetPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } }

  .code-preview {
    font-family: var(--font-mono); font-size: 0.73rem; line-height: 1.7;
    background: rgba(0,0,0,0.35); border-radius: var(--radius-sm);
    padding: 16px; border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
  }
  .code-key { color: var(--purple); }
  .code-val { color: var(--cyan); }
  .code-str { color: var(--emerald); }

  .tracking-viz { display: flex; flex-direction: column; gap: 10px; }
  .track-row { display: flex; align-items: center; gap: 12px; font-size: 0.78rem; }
  .track-icon { font-size: 16px; }
  .track-label { color: var(--text-secondary); flex: 1; }
  .track-verified { display: flex; align-items: center; gap: 5px; font-family: var(--font-mono); font-size: 0.68rem; color: var(--emerald); }
  .track-bot { color: var(--text-muted); text-decoration: line-through; }

  .clock-dial {
    width: 80px; height: 80px; border-radius: 50%;
    border: 2px solid rgba(123,97,255,0.3);
    position: relative; display: flex; align-items: center; justify-content: center;
  }
  .clock-hand {
    position: absolute; bottom: 50%; left: 50%;
    width: 2px; height: 28px; background: var(--purple);
    transform-origin: bottom center; transform: rotate(120deg) translateX(-50%);
    border-radius: 2px;
    animation: clockTick 4s linear infinite;
  }
  .clock-hand.short {
    height: 18px; width: 3px; background: var(--cyan);
    animation: clockTick 48s linear infinite;
  }
  @keyframes clockTick { to { transform: rotate(480deg) translateX(-50%); } }
  .clock-center { width: 6px; height: 6px; background: var(--text-primary); border-radius: 50%; }

  .sched-times { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
  .sched-item {
    display: flex; align-items: center; gap: 10px; font-size: 0.78rem;
    padding: 8px 12px; border-radius: var(--radius-sm);
    background: rgba(255,255,255,0.025); border: 1px solid var(--border-subtle);
  }
  .sched-time { font-family: var(--font-mono); color: var(--purple); font-size: 0.72rem; }
  .sched-label { color: var(--text-secondary); flex: 1; }
  .sched-badge { font-family: var(--font-mono); font-size: 0.6rem; padding: 2px 7px; border-radius: 20px; }
  .sb-active { background: rgba(0,255,163,0.1); color: var(--emerald); }
  .sb-pending { background: rgba(123,97,255,0.1); color: var(--purple); }

  /* ─── WHY US ─── */
  #why { padding: 120px 0; background: linear-gradient(180deg, transparent, rgba(0,229,255,0.025) 50%, transparent); }
  .why-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .why-visual { order: 2; }

  .comparison-table {
    border-radius: var(--radius-lg); overflow: hidden;
    border: 1px solid var(--border-subtle);
  }
  .ct-header {
    display: grid; grid-template-columns: 2fr 1fr 1fr;
    padding: 14px 20px; background: rgba(255,255,255,0.03);
    border-bottom: 1px solid var(--border-subtle);
    font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);
    letter-spacing: 0.08em;
  }
  .ct-header .col-pro { color: var(--cyan); }
  .ct-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr;
    padding: 14px 20px; border-bottom: 1px solid var(--border-subtle);
    font-size: 0.84rem; align-items: center; transition: background 0.2s;
  }
  .ct-row:last-child { border-bottom: none; }
  .ct-row:hover { background: rgba(0,229,255,0.025); }
  .ct-feature { color: var(--text-secondary); }
  .ct-check { text-align: center; font-size: 16px; }
  .check-yes { color: var(--emerald); }
  .check-no { color: var(--text-muted); opacity: 0.4; }

  .why-checklist { display: flex; flex-direction: column; gap: 28px; }
  .check-item { display: flex; gap: 18px; }
  .check-dot {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: var(--cyan-dim); border: 1px solid rgba(0,229,255,0.25);
    display: flex; align-items: center; justify-content: center; font-size: 18px;
    margin-top: 2px;
  }
  .check-text h4 { font-family: var(--font-display); font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
  .check-text p { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; }

  /* ─── METRICS RIBBON ─── */
  .metrics-ribbon {
    padding: 48px 0; position: relative; overflow: hidden;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    background: rgba(255,255,255,0.015);
  }
  .metrics-inner { display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 40px; }
  .metric-item { text-align: center; }
  .metric-num {
    font-family: var(--font-display); font-weight: 800; font-size: 2.6rem;
    letter-spacing: -0.04em; line-height: 1;
    background: linear-gradient(135deg, var(--cyan), var(--emerald));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .metric-label { font-size: 0.82rem; color: var(--text-muted); margin-top: 6px; font-family: var(--font-mono); letter-spacing: 0.05em; }
  .metric-divider { width: 1px; height: 60px; background: var(--border-subtle); }

  /* ─── FINAL CTA ─── */
  #cta {
    padding: 120px 0 0;
  }
  .cta-box {
    border-radius: var(--radius-xl); padding: 80px 60px;
    background: linear-gradient(135deg, rgba(0,229,255,0.07) 0%, rgba(0,255,163,0.04) 50%, rgba(123,97,255,0.07) 100%);
    border: 1px solid rgba(0,229,255,0.15);
    text-align: center; position: relative; overflow: hidden;
    box-shadow: 0 0 100px rgba(0,229,255,0.08), inset 0 1px 0 rgba(255,255,255,0.07);
  }
  .cta-box::before {
    content: ''; position: absolute;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,229,255,0.08), transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
  }
  .cta-box > * { position: relative; z-index: 1; }
  .cta-h2 {
    font-family: var(--font-display); font-weight: 800;
    font-size: clamp(2rem, 4vw, 3.2rem); letter-spacing: -0.03em;
    margin-bottom: 18px;
  }
  .cta-sub { font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 44px; }
  .btn-cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 18px 40px; border-radius: 100px;
    background: linear-gradient(135deg, #00E5FF, #00C2D4);
    color: #07070D; font-weight: 700; font-size: 1.1rem;
    border: none; cursor: pointer; text-decoration: none;
    font-family: var(--font-display); letter-spacing: -0.01em;
    box-shadow: 0 0 50px rgba(0,229,255,0.45), 0 10px 30px rgba(0,0,0,0.4);
    transition: all 0.3s ease;
  }
  .btn-cta:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 0 90px rgba(0,229,255,0.6), 0 14px 40px rgba(0,0,0,0.4); }
  .cta-note { font-size: 0.8rem; color: var(--text-muted); margin-top: 16px; font-family: var(--font-mono); }

  /* ─── FOOTER ─── */
  footer {
    margin-top: 60px; padding: 48px 0 40px;
    border-top: 1px solid var(--border-subtle);
  }
  .footer-inner {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 24px;
  }
  .footer-copy { font-size: 0.82rem; color: var(--text-muted); }
  .footer-links { display: flex; gap: 28px; }
  .footer-links a { font-size: 0.82rem; color: var(--text-muted); text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: var(--text-secondary); }
  .footer-social { display: flex; gap: 14px; }
  .social-btn {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted); font-size: 14px; text-decoration: none;
    transition: all 0.2s;
  }
  .social-btn:hover { background: rgba(0,229,255,0.08); border-color: rgba(0,229,255,0.25); color: var(--cyan); }

  /* ─── SCROLL REVEAL ─── */
  .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
  .reveal.visible { opacity: 1; transform: none; }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }
  .reveal-delay-4 { transition-delay: 0.4s; }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 900px) {
    .hero-inner, .why-inner { grid-template-columns: 1fr; gap: 60px; }
    .bento-grid { grid-template-columns: 1fr; }
    .bento-card.wide { grid-column: span 1; }
    .nav-links { display: none; }
    .metrics-inner { gap: 28px; }
    .metric-divider { display: none; }
    .why-visual { order: -1; }
    .cta-box { padding: 50px 28px; }
  }
</style>
</head>
<body>
`;

const bodyStr = raw.substring(raw.indexOf('</style>') + 8, raw.lastIndexOf('<script>'));

const cssMatch = raw.match(/<style>([\s\S]*?)<\/style>/);
const cssStyles = cssMatch ? cssMatch[1] : '';

// Wrap it as a React component
const reactComponent = \`'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (containerRef.current) {
        // Link overrides
        const links = containerRef.current.querySelectorAll('a[href="#"]');
        links.forEach(link => {
            if (link.classList.contains('btn-hero') || link.classList.contains('btn-primary')) {
                link.setAttribute('href', '/dashboard');
                // Use next standard pushing
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    router.push('/dashboard');
                });
            }
        });

        // Script logic transferred:
        const navbar = document.getElementById('navbar');
        const handleScroll = () => {
          if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll);

        const revealEls = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(e => { 
            if (e.isIntersecting) { 
                e.target.classList.add('visible'); 
                observer.unobserve(e.target); 
            } 
          });
        }, { threshold: 0.12 });
        revealEls.forEach(el => observer.observe(el));

        const cards = document.querySelectorAll('.bento-card');
        cards.forEach(card => {
          card.addEventListener('mousemove', (e) => {
            const ev = e;
            const rect = card.getBoundingClientRect();
            (card).style.setProperty('--mouse-x', ((ev.clientX - rect.left) / rect.width * 100) + '%');
            (card).style.setProperty('--mouse-y', ((ev.clientY - rect.top) / rect.height * 100) + '%');
          });
        });

        return () => {
             window.removeEventListener('scroll', handleScroll);
             observer.disconnect();
        };
    }
  }, [router]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: \`\${cssStyles.replace(/`/g, '\\\\`')}\` }} />
      <div 
        ref={containerRef}
        className="legacy-html-wrapper"
        dangerouslySetInnerHTML={{ __html: \`\${bodyStr.replace(/`/g, '\\\\`')}\` }} 
      />
    </>
  );
}
\`;

fs.writeFileSync('/Users/user/Desktop/MailBlast Pro/mailblast-web/src/app/page.tsx', reactComponent);
