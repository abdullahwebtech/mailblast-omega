'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    /* ── NAVBAR ── */
    const nav = document.getElementById('nav');
    const handleScroll = () => { if (nav) nav.classList.toggle('stuck', window.scrollY > 20); };
    window.addEventListener('scroll', handleScroll);

    /* ── MOBILE MENU ── */
    const ham = document.getElementById('ham');
    const mob = document.getElementById('mob');
    if (ham && mob) {
      const toggleMenu = () => { ham.classList.toggle('open'); mob.classList.toggle('open'); };
      const closeMenu = () => { ham.classList.remove('open'); mob.classList.remove('open'); };
      ham.addEventListener('click', toggleMenu);
      mob.querySelectorAll('a, button').forEach(a => a.addEventListener('click', closeMenu));
    }
    /* ── SCROLL REVEAL ── */
    const revEls = document.querySelectorAll('.rev');
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
    revEls.forEach(el => io.observe(el));

    /* ── ANIMATED BARS ── */
    const animBars = (selector: string) => {
      document.querySelectorAll<HTMLElement>(selector).forEach(bar => {
        new IntersectionObserver((es) => {
          es.forEach(e => {
            if (e.isIntersecting) {
              setTimeout(() => { (e.target as HTMLElement).style.width = (e.target as HTMLElement).dataset.w + '%'; }, 300);
            }
          });
        }, { threshold: 0.5 }).observe(bar);
      });
    };
    animBars('.bar-fg'); animBars('.ab-fg');

    /* ── DISPATCH TRACK ── */
    const dpFill = document.getElementById('dpfill');
    const dots = [0, 1, 2, 3, 4].map(i => document.getElementById('dp' + i));
    let dpStep = 0;
    let dpInterval: ReturnType<typeof setInterval> | null = null;
    const stepDP = () => {
      dpStep = (dpStep + 1) % 6;
      if (dpFill) dpFill.style.width = (dpStep / 5 * 100) + '%';
      dots.forEach((d, i) => { if (d) d.classList.toggle('lit', i <= dpStep - 1); });
      if (dpStep === 5) {
        setTimeout(() => {
          dpStep = 0;
          if (dpFill) { dpFill.style.transition = 'none'; dpFill.style.width = '0%'; }
          dots.forEach(d => { if (d) d.classList.remove('lit'); });
          setTimeout(() => { if (dpFill) dpFill.style.transition = 'width 1.6s cubic-bezier(.16,1,.3,1)'; }, 100);
        }, 1200);
      }
    };
    const dpObs = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { dpInterval = setInterval(stepDP, 700); dpObs.disconnect(); } });
    }, { threshold: 0.4 });
    if (dpFill) dpObs.observe(dpFill);

    /* ── LIVE COUNTER ── */
    let cnt = 2847;
    const lcnt = document.getElementById('lcnt');
    const liveInterval = setInterval(() => {
      cnt = Math.max(2600, Math.min(3300, cnt + Math.floor(Math.random() * 14) - 4));
      if (lcnt) lcnt.textContent = cnt.toLocaleString();
    }, 1900);

    /* ── FAQ ── */
    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.parentElement;
        const was = item?.classList.contains('on');
        document.querySelectorAll('.faq-item.on').forEach(i => i.classList.remove('on'));
        if (!was && item) item.classList.add('on');
      });
    });

    /* ── CTA LINKS → auth ── */
    const ctaSelectors = ['.btn-hero', '.btn-cta', '.btn-plan'];
    ctaSelectors.forEach(sel => {
      document.querySelectorAll<HTMLAnchorElement>(sel).forEach(el => {
        if (el.getAttribute('href') === '#' || el.getAttribute('href') === '') {
          el.addEventListener('click', (e) => { e.preventDefault(); router.push(user ? '/dashboard' : '/auth'); });
        }
      });
    });

    /* ── SMOOTH SCROLL ── */
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href') || '';
        if (href === '#' || href === '') return;
        try {
          const t = document.querySelector(href);
          if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
        } catch { /* invalid selector, skip */ }
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      io.disconnect();
      if (dpInterval) clearInterval(dpInterval);
      clearInterval(liveInterval);
    };
  }, [router, user]);

  const allCss = css + css2 + css3 + css4 + css5 + css6 + css7 + css8 + css9;
  const mainHtml = html2 + html3 + html4 + html5 + html6 + html7 + html8;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `html, body { background: #FAFAFA !important; color: #0C0D10 !important; } ` + allCss }} />
      
      <nav id="nav">
        <div className="wrap">
          <div className="nav-row">
            <a href="/" className="logo">
              <div className="logo-gem"><svg viewBox="0 0 16 16" fill="none"><path d="M9 2L3 9h5l-1 5 6-7H8L9 2Z" fill="#fff" stroke="#fff" strokeWidth=".4" strokeLinejoin="round"/></svg></div>
              MailBlast Pro
            </a>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#why">Why Us</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
            <div className="nav-right">
              {!user ? (
                <>
                  <a href="#" className="btn-ghost" onClick={(e) => { e.preventDefault(); router.push('/auth'); }}>Login</a>
                  <a href="#" className="btn-pill" onClick={(e) => { e.preventDefault(); router.push('/auth'); }}>Get Started Free</a>
                </>
              ) : (
                <>
                  <a href="#" className="btn-ghost" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}>View Dashboard</a>
                  <button className="btn-pill" onClick={() => signOut()}>Sign Out</button>
                </>
              )}
              <button className="ham" id="ham" aria-label="Menu"><span></span><span></span><span></span></button>
            </div>
          </div>
        </div>
        <div className="mobile-menu" id="mob">
          <a href="#features">Features</a>
          <a href="#why">Why Us</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          {!user ? (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); router.push('/auth'); }}>Login</a>
              <a href="#" onClick={(e) => { e.preventDefault(); router.push('/auth'); }} style={{color:'var(--brand)', fontWeight:700}}>Get Started Free →</a>
            </>
          ) : (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}>View Dashboard</a>
              <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }} style={{color:'var(--brand)', fontWeight:700}}>Sign Out</a>
            </>
          )}
        </div>
      </nav>

      <div dangerouslySetInnerHTML={{ __html: mainHtml }} />
    </>
  );
}

const css = `
:root {
  --bg: #FAFAFA; --bg-alt: #F2F3F5; --bg-card: #FFFFFF; --border: #D8DADF; --border-lt: #E8E9EC;
  --blue-lt: #8BCAF9; --blue: #40AAF8; --brand: #1297FD; --brand-dk: #0A82E0;
  --green: #22C55E; --green-lt: rgba(34,197,94,.1); --red: #EF4444; --amber: #F59E0B;
  --text-1: #0C0D10; --text-2: #474A56; --text-3: #8D909C;
  --font-head: 'Bricolage Grotesque', sans-serif; --font-body: 'Instrument Sans', sans-serif; --font-mono: 'Fira Code', monospace;
  --r1: 8px; --r2: 14px; --r3: 20px; --r4: 28px;
  --shadow-sm: 0 1px 4px rgba(0,0,0,.06); --shadow-md: 0 4px 20px rgba(0,0,0,.08); --shadow-lg: 0 12px 48px rgba(0,0,0,.1);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text-1);font-family:var(--font-body);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 80vw 50vh at 15% 0%,rgba(18,151,253,.05) 0%,transparent 70%),radial-gradient(ellipse 60vw 40vh at 85% 90%,rgba(64,170,248,.04) 0%,transparent 70%);}
.wrap{max-width:1160px;margin:0 auto;padding:0 clamp(16px,4vw,40px);position:relative;z-index:1}
section{position:relative;z-index:1}
`;

const css2 = `
#nav{position:fixed;top:0;left:0;right:0;z-index:300;background:rgba(250,250,250,.9);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border-lt);transition:box-shadow .3s;}
#nav.stuck{box-shadow:0 2px 20px rgba(0,0,0,.07)}
.nav-row{display:flex;align-items:center;justify-content:space-between;height:62px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-family:var(--font-head);font-weight:800;font-size:1.05rem;color:var(--text-1);letter-spacing:-.02em}
.logo-gem{width:32px;height:32px;border-radius:9px;background:var(--brand);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(18,151,253,.35);flex-shrink:0;}
.logo-gem svg{width:16px;height:16px}
.nav-links{display:flex;align-items:center;gap:28px;list-style:none}
.nav-links a{color:var(--text-2);text-decoration:none;font-size:.875rem;font-weight:500;transition:color .2s}
.nav-links a:hover{color:var(--text-1)}
.nav-right{display:flex;align-items:center;gap:14px}
.btn-ghost{background:none;border:none;color:var(--text-2);font-size:.875rem;font-weight:500;cursor:pointer;font-family:var(--font-body);text-decoration:none;transition:color .2s}
.btn-ghost:hover{color:var(--text-1)}
.btn-pill{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:100px;background:var(--brand);color:#fff;font-weight:600;font-size:.875rem;border:none;cursor:pointer;text-decoration:none;font-family:var(--font-body);box-shadow:0 2px 12px rgba(18,151,253,.32);transition:all .22s;}
.btn-pill:hover{background:var(--brand-dk);transform:translateY(-1px);box-shadow:0 4px 18px rgba(18,151,253,.42)}
.ham{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px}
.ham span{display:block;width:22px;height:2px;background:var(--text-2);border-radius:2px;transition:all .25s}
.ham.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.ham.open span:nth-child(2){opacity:0}
.ham.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.mobile-menu{display:none;flex-direction:column;gap:0;background:var(--bg-card);border-top:1px solid var(--border-lt);padding:8px 0 16px;}
.mobile-menu.open{display:flex}
.mobile-menu a{padding:13px clamp(16px,4vw,40px);color:var(--text-2);text-decoration:none;font-size:.9rem;font-weight:500;border-bottom:1px solid var(--border-lt);transition:color .2s;}
.mobile-menu a:last-child{border-bottom:none}
.mobile-menu a:hover{color:var(--brand)}
`;

const css3 = `
.hero{padding:clamp(100px,14vw,140px) 0 clamp(60px,8vw,90px);min-height:100vh;display:flex;align-items:center}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,80px);align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border-radius:100px;background:rgba(18,151,253,.07);border:1px solid rgba(18,151,253,.18);font-family:var(--font-mono);font-size:.68rem;color:var(--brand);letter-spacing:.08em;text-transform:uppercase;margin-bottom:24px;}
.e-dot{width:6px;height:6px;border-radius:50%;background:var(--brand);animation:blink 2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.hero-h1{font-family:var(--font-head);font-weight:800;font-size:clamp(2.2rem,4.5vw,3.7rem);line-height:1.06;letter-spacing:-.035em;margin-bottom:20px;animation:fadeUp .7s ease both;}
.hero-h1 em{font-style:normal;color:var(--brand)}
.u-line{display:inline-block;position:relative}
.u-line::after{content:'';position:absolute;left:0;bottom:-3px;right:0;height:3px;background:var(--blue);border-radius:2px;transform:scaleX(0);transform-origin:left;animation:lineIn .8s .6s ease forwards;}
@keyframes lineIn{to{transform:scaleX(1)}}
.hero-sub{font-size:clamp(.9rem,1.5vw,1.05rem);color:var(--text-2);line-height:1.78;max-width:460px;margin-bottom:36px;animation:fadeUp .7s .15s ease both;}
.hero-btns{display:flex;align-items:center;gap:16px;flex-wrap:wrap;animation:fadeUp .7s .25s ease both}
.btn-hero{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:100px;background:var(--brand);color:#fff;font-weight:600;font-size:1rem;border:none;cursor:pointer;text-decoration:none;font-family:var(--font-body);box-shadow:0 4px 20px rgba(18,151,253,.35);transition:all .24s;}
.btn-hero:hover{background:var(--brand-dk);transform:translateY(-2px);box-shadow:0 8px 28px rgba(18,151,253,.44)}
.btn-hero .arr{transition:transform .2s}
.btn-hero:hover .arr{transform:translateX(4px)}
.btn-demo{display:inline-flex;align-items:center;gap:10px;color:var(--text-2);text-decoration:none;font-weight:500;font-size:.95rem;transition:color .2s;}
.btn-demo:hover{color:var(--text-1)}
.play-ring{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;background:var(--bg-card);box-shadow:var(--shadow-sm);transition:all .2s;}
.btn-demo:hover .play-ring{border-color:var(--brand);box-shadow:0 2px 12px rgba(18,151,253,.2)}
.hero-trust{margin-top:34px;display:flex;align-items:center;gap:14px;animation:fadeUp .7s .35s ease both}
.avatars{display:flex}
.avatars i{width:30px;height:30px;border-radius:50%;border:2px solid #fff;margin-left:-8px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:.67rem;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--blue) 0%,var(--brand) 100%);}
.avatars i:first-child{margin-left:0}
.avatars i:nth-child(2){background:linear-gradient(135deg,#70C8F8,var(--blue))}
.avatars i:nth-child(3){background:linear-gradient(135deg,#AAD8FB,#40AAF8)}
.avatars i:nth-child(4){background:linear-gradient(135deg,var(--brand),var(--brand-dk))}
.trust-text{font-size:.8rem;color:var(--text-3);line-height:1.45}
.trust-text strong{color:var(--text-2);font-weight:600}
.stars{color:#F59E0B;font-size:.72rem;letter-spacing:1px}
.live-chip{margin-top:18px;display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.18);border-radius:100px;padding:5px 14px;font-family:var(--font-mono);font-size:.68rem;color:#15803D;animation:fadeUp .7s .4s ease both;}
.l-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;animation:blink 1.5s ease-in-out infinite}
`;

const css4 = `
.hero-visual{position:relative;animation:fadeUp .7s .1s ease both}
.dash-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r4);box-shadow:0 2px 4px rgba(0,0,0,.04),0 20px 60px rgba(0,0,0,.09);overflow:hidden;}
.dc-bar{padding:13px 18px;background:var(--bg-alt);border-bottom:1px solid var(--border-lt);display:flex;align-items:center;gap:7px;}
.d1{width:10px;height:10px;border-radius:50%;background:#FF5F57}
.d2{width:10px;height:10px;border-radius:50%;background:#FEBC2E}
.d3{width:10px;height:10px;border-radius:50%;background:#28C840}
.dc-tabs{display:flex;gap:4px;margin-left:14px}
.dc-tab{padding:4px 11px;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all .2s;}
.dc-tab.on{background:var(--bg-card);color:var(--text-1);box-shadow:var(--shadow-sm)}
.dc-tab:not(.on){color:var(--text-3)}
.dc-body{padding:18px}
.camp-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.camp-title{font-size:.78rem;font-weight:700;font-family:var(--font-head);color:var(--text-1)}
.btn-new{background:var(--brand);color:#fff;border:none;border-radius:6px;padding:4px 11px;font-size:.68rem;font-weight:600;cursor:pointer;font-family:var(--font-body);}
.cr{display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;margin-bottom:5px;background:var(--bg);border:1px solid var(--border-lt);transition:border-color .2s;}
.cr:hover{border-color:var(--blue-lt)}
.cr-name{font-size:.75rem;font-weight:600;color:var(--text-1)}
.cr-sent{font-size:.68rem;color:var(--text-3)}
.cr-rate{font-size:.7rem;font-weight:700;font-family:var(--font-mono);color:var(--green)}
.cr-tag{font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:100px;letter-spacing:.04em;text-transform:uppercase}
.t-live{background:rgba(34,197,94,.1);color:#15803D}
.t-que{background:rgba(18,151,253,.1);color:var(--brand)}
.t-done{background:rgba(142,145,158,.1);color:var(--text-3)}
.dc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.dc-stat{background:var(--bg-alt);border-radius:9px;padding:10px 12px;border:1px solid var(--border-lt)}
.ds-n{font-family:var(--font-head);font-weight:800;font-size:1.25rem;color:var(--text-1);line-height:1;margin-bottom:2px}
.ds-n span{font-size:.8rem;color:var(--brand)}
.ds-l{font-size:.62rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em}
.fc{position:absolute;background:var(--bg-card);border:1px solid var(--border);border-radius:11px;padding:9px 13px;box-shadow:0 6px 24px rgba(0,0,0,.1);font-size:.72rem;display:flex;align-items:center;gap:8px;animation:bob 4s ease-in-out infinite;white-space:nowrap;z-index:10;}
.fc-l{left:-28px;bottom:70px;animation-delay:0s}
.fc-r{right:-20px;top:70px;animation-delay:-2s}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.fc-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.fc-g{background:#22C55E}
.fc-b{background:var(--brand)}
.fc-lbl{font-weight:700;color:var(--text-1)}
.fc-val{color:var(--text-3)}
`;

const css5 = `
.sec-tag{font-family:var(--font-mono);font-size:.68rem;color:var(--brand);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px}
.sec-h{font-family:var(--font-head);font-weight:800;font-size:clamp(1.8rem,3vw,2.5rem);line-height:1.1;letter-spacing:-.03em;color:var(--text-1);margin-bottom:14px}
.sec-sub{font-size:.975rem;color:var(--text-2);line-height:1.75;max-width:560px}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.rev{opacity:0;transform:translateY(22px);transition:opacity .65s ease,transform .65s ease}
.rev.in{opacity:1;transform:translateY(0)}
.d1x{transition-delay:.1s}.d2x{transition-delay:.2s}.d3x{transition-delay:.3s}.d4x{transition-delay:.4s}
.ticker-wrap{padding:32px 0;border-top:1px solid var(--border-lt);border-bottom:1px solid var(--border-lt);overflow:hidden;}
.ticker-lbl{text-align:center;font-size:.75rem;font-weight:500;color:var(--text-3);letter-spacing:.07em;text-transform:uppercase;margin-bottom:20px}
.ticker-belt{display:flex;animation:roll 28s linear infinite;width:max-content}
.ticker-belt:hover{animation-play-state:paused}
.t-item{display:flex;align-items:center;gap:9px;padding:0 40px;font-family:var(--font-head);font-weight:700;font-size:.88rem;color:var(--text-3);white-space:nowrap}
.t-sep{width:4px;height:4px;border-radius:50%;background:var(--border)}
@keyframes roll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.feat-section{padding:clamp(70px,10vw,110px) 0}
.feat-hdr{text-align:center;margin-bottom:clamp(40px,6vw,64px)}
.feat-hdr .sec-sub{margin:0 auto}
.bento{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto auto;gap:18px}
.b-card{background:var(--bg-card);border:1px solid var(--border-lt);border-radius:var(--r3);padding:clamp(22px,3vw,32px);position:relative;overflow:hidden;transition:border-color .25s,box-shadow .25s,transform .25s;}
.b-card::before{content:'';position:absolute;inset:0;border-radius:var(--r3);background:linear-gradient(135deg,rgba(18,151,253,.04) 0%,transparent 60%);opacity:0;transition:opacity .3s;}
.b-card:hover{border-color:var(--blue-lt);box-shadow:0 8px 32px rgba(18,151,253,.08);transform:translateY(-3px)}
.b-card:hover::before{opacity:1}
.b-card.span2{grid-column:span 2}
.b-icon{width:46px;height:46px;border-radius:12px;background:rgba(18,151,253,.08);border:1px solid rgba(18,151,253,.14);display:flex;align-items:center;justify-content:center;margin-bottom:18px;position:relative;z-index:1;}
.b-icon svg{width:21px;height:21px;stroke:var(--brand);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.b-tag{display:inline-block;padding:3px 10px;border-radius:100px;font-family:var(--font-mono);font-size:.6rem;font-weight:500;letter-spacing:.07em;text-transform:uppercase;background:rgba(18,151,253,.07);border:1px solid rgba(18,151,253,.14);color:var(--brand);margin-bottom:12px;position:relative;z-index:1;}
.b-name{font-family:var(--font-head);font-weight:700;font-size:1.05rem;color:var(--text-1);margin-bottom:9px;position:relative;z-index:1}
.b-desc{font-size:.875rem;color:var(--text-2);line-height:1.72;position:relative;z-index:1}
`;

const css6 = `
.dispatch-vis{margin-top:22px;background:var(--bg-alt);border-radius:12px;padding:18px;border:1px solid var(--border-lt);position:relative;z-index:1;}
.dp-track{position:relative;height:8px;background:var(--border-lt);border-radius:100px;margin-bottom:14px}
.dp-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,var(--brand) 0%,var(--blue-lt) 100%);width:0%;transition:width 1.6s cubic-bezier(.16,1,.3,1);}
.dp-dots{position:absolute;top:50%;transform:translateY(-50%);width:100%;display:flex;justify-content:space-between;pointer-events:none}
.dp-dot{width:12px;height:12px;border-radius:50%;border:2px solid var(--bg-card);background:var(--border);transition:background .3s;position:relative;margin-top:0;flex-shrink:0;}
.dp-dot.lit{background:var(--brand);box-shadow:0 0 6px rgba(18,151,253,.5)}
.dp-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.dp-m{background:var(--bg-card);border:1px solid var(--border-lt);border-radius:8px;padding:10px 12px}
.dp-m label{font-family:var(--font-mono);font-size:.6rem;color:var(--text-3);display:block;margin-bottom:3px}
.dp-m span{font-size:.78rem;font-weight:600;color:var(--text-1)}
.code-block{margin-top:22px;background:#14151A;border-radius:12px;padding:16px 18px;font-family:var(--font-mono);font-size:.76rem;line-height:1.85;position:relative;z-index:1;}
.ck{color:#8BCAF9}.cv{color:#98D89E}.cc{color:#4A5060;font-style:italic}.cn{color:#F5A623}.cb{color:#40AAF8}
.track-inner{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start;margin-top:18px;position:relative;z-index:1}
.tr-row{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:9px;margin-bottom:6px;background:var(--bg-alt);border:1px solid var(--border-lt);font-size:.78rem;}
.tr-email{color:var(--text-2);font-family:var(--font-mono);font-size:.72rem}
.tr-email.bot{text-decoration:line-through;color:var(--text-3)}
.tr-badge{font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:100px;text-transform:uppercase;letter-spacing:.05em}
.tb-human{background:rgba(34,197,94,.1);color:#15803D}
.tb-bot{background:rgba(239,68,68,.08);color:#DC2626}
.bar-row{margin-bottom:10px}
.bar-lbl{display:flex;justify-content:space-between;margin-bottom:4px;font-size:.72rem}
.bar-lbl span:first-child{color:var(--text-2);font-weight:500}
.bar-lbl span:last-child{font-family:var(--font-mono);font-weight:700;color:var(--text-1)}
.bar-bg{height:7px;background:var(--border-lt);border-radius:100px;overflow:hidden}
.bar-fg{height:100%;border-radius:100px;background:linear-gradient(90deg,var(--blue),var(--brand));width:0;transition:width 1.4s cubic-bezier(.16,1,.3,1)}
.sched-vis{margin-top:20px;position:relative;z-index:1}
.sched-clock{width:64px;height:64px;border-radius:50%;border:2px solid var(--border-lt);display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:var(--bg-alt);position:relative;overflow:hidden;}
.clock-hand{position:absolute;bottom:50%;left:50%;transform-origin:bottom;width:2px;background:var(--brand);border-radius:2px;animation:tick 8s linear infinite;}
.ch-s{height:22px;transform:translateX(-50%) rotate(0deg)}
.ch-m{height:17px;transform:translateX(-50%) rotate(90deg);background:var(--text-2)}
@keyframes tick{to{transform:translateX(-50%) rotate(360deg)}}
.sched-r{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:9px;border:1px solid var(--border-lt);background:var(--bg);margin-bottom:7px;}
.sched-time{font-family:var(--font-mono);font-size:.72rem;font-weight:500;color:var(--text-1);min-width:40px}
.sched-lbl{font-size:.78rem;font-weight:500;color:var(--text-2);flex:1}
.sched-badge{font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:100px;text-transform:uppercase;letter-spacing:.05em}
.sb-live{background:rgba(34,197,94,.1);color:#15803D}
.sb-q{background:rgba(18,151,253,.1);color:var(--brand)}
.ab-vis{margin-top:20px;position:relative;z-index:1}
.ab-bars{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ab-bar-wrap{background:var(--bg-alt);border-radius:10px;padding:14px;border:1px solid var(--border-lt)}
.ab-label{font-size:.7rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
.ab-pct{font-family:var(--font-head);font-weight:800;font-size:1.5rem;color:var(--text-1);margin-bottom:6px}
.ab-bg{height:6px;background:var(--border-lt);border-radius:100px;overflow:hidden}
.ab-fg{height:100%;border-radius:100px;width:0;transition:width 1.4s cubic-bezier(.16,1,.3,1)}
.ab-a{background:var(--brand)}
.ab-b{background:var(--green)}
.ab-win{margin-top:12px;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.18);border-radius:8px;padding:8px 12px;font-size:.75rem;font-weight:600;color:#15803D;display:flex;align-items:center;gap:6px;}
`;

const css7 = `
.metrics-band{background:var(--brand);padding:clamp(44px,7vw,60px) 0;position:relative;overflow:hidden;}
.metrics-band::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,rgba(255,255,255,.08),transparent 60%),radial-gradient(circle at 80% 50%,rgba(255,255,255,.06),transparent 60%);}
.met-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:0;position:relative}
.met-item{text-align:center;padding:0 16px;position:relative}
.met-item:not(:last-child)::after{content:'';position:absolute;right:0;top:15%;bottom:15%;width:1px;background:rgba(255,255,255,.2);}
.met-n{font-family:var(--font-head);font-weight:800;font-size:clamp(1.7rem,3vw,2.3rem);color:#fff;line-height:1;margin-bottom:7px;letter-spacing:-.03em}
.met-l{font-size:.8rem;color:rgba(255,255,255,.72);font-weight:500}
.workflow-sec{padding:clamp(70px,10vw,110px) 0;background:var(--bg-alt)}
.wf-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,7vw,80px);align-items:center}
.wf-steps{margin-top:36px}
.wf-step{display:flex;gap:18px;margin-bottom:32px;position:relative}
.wf-step:not(:last-child)::after{content:'';position:absolute;left:18px;top:40px;bottom:-10px;width:1px;background:linear-gradient(to bottom,var(--border),transparent);}
.wf-num{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:var(--bg-card);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-weight:800;font-size:.82rem;color:var(--brand);box-shadow:var(--shadow-sm);transition:all .25s;position:relative;z-index:1;}
.wf-step:hover .wf-num{background:var(--brand);color:#fff;border-color:var(--brand);box-shadow:0 4px 16px rgba(18,151,253,.3)}
.wf-body h4{font-family:var(--font-head);font-weight:700;font-size:.95rem;color:var(--text-1);margin-bottom:4px}
.wf-body p{font-size:.875rem;color:var(--text-2);line-height:1.68}
.term{background:#13141A;border-radius:var(--r3);overflow:hidden;border:1px solid #22232C;box-shadow:0 20px 56px rgba(0,0,0,.14);}
.term-bar{padding:11px 16px;background:#1C1D25;border-bottom:1px solid #22232C;display:flex;align-items:center;gap:6px;}
.term-title{font-family:var(--font-mono);font-size:.68rem;color:#4A4D60;margin-left:10px}
.term-code{padding:22px;font-family:var(--font-mono);font-size:.77rem;line-height:1.85}
.tc-m{color:#4A4D60}.tc-k{color:#8BCAF9}.tc-s{color:#98D89E}.tc-n{color:#F59E0B}.tc-c{color:#3D405A;font-style:italic}.tc-b{color:#40AAF8}
.caret{display:inline-block;width:8px;height:13px;background:#8BCAF9;border-radius:1px;margin-left:2px;animation:caret 1.1s step-end infinite;vertical-align:text-bottom}
@keyframes caret{0%,100%{opacity:1}50%{opacity:0}}
.why-sec{padding:clamp(70px,10vw,110px) 0}
.why-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,7vw,80px);align-items:start}
.chk-list{margin-top:36px}
.chk-item{display:flex;gap:15px;margin-bottom:26px;padding-bottom:26px;border-bottom:1px solid var(--border-lt)}
.chk-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.chk-ic{width:36px;height:36px;border-radius:10px;background:rgba(18,151,253,.07);border:1px solid rgba(18,151,253,.13);display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;margin-top:1px}
.chk-body h4{font-family:var(--font-head);font-weight:700;font-size:.93rem;color:var(--text-1);margin-bottom:4px}
.chk-body p{font-size:.87rem;color:var(--text-2);line-height:1.68}
.comp-tbl{background:var(--bg-card);border:1px solid var(--border-lt);border-radius:var(--r3);overflow:hidden;box-shadow:var(--shadow-md)}
.ct-hd{display:grid;grid-template-columns:1fr 110px 90px;background:var(--bg-alt);padding:11px 18px;border-bottom:1px solid var(--border-lt)}
.ct-hd div{font-size:.68rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.07em}
.ct-hd .p-col{color:var(--brand)}
.ct-r{display:grid;grid-template-columns:1fr 110px 90px;padding:12px 18px;border-bottom:1px solid var(--border-lt);align-items:center;transition:background .2s}
.ct-r:last-child{border-bottom:none}
.ct-r:hover{background:rgba(18,151,253,.025)}
.ct-f{font-size:.82rem;font-weight:500;color:var(--text-2)}
.ct-c{font-size:.88rem;font-weight:700}
.cy{color:#22C55E}.cn2{color:#EF4444}.cm{color:var(--text-3)}
`;

const css8 = `
.testi-sec{padding:clamp(70px,10vw,110px) 0;background:var(--bg-alt)}
.testi-hdr{text-align:center;margin-bottom:clamp(36px,5vw,56px)}
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.testi-card{background:var(--bg-card);border-radius:var(--r3);padding:clamp(20px,3vw,28px);border:1px solid var(--border-lt);box-shadow:var(--shadow-sm);transition:transform .25s,box-shadow .25s;}
.testi-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}
.t-stars{color:#F59E0B;font-size:.78rem;letter-spacing:2px;margin-bottom:13px}
.t-text{font-size:.875rem;color:var(--text-2);line-height:1.78;margin-bottom:18px;font-style:italic}
.t-auth{display:flex;align-items:center;gap:11px}
.t-av{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--blue-lt),var(--brand));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-weight:800;font-size:.78rem;color:#fff;}
.t-name{font-family:var(--font-head);font-weight:700;font-size:.84rem;color:var(--text-1)}
.t-role{font-size:.73rem;color:var(--text-3)}
.pricing-sec{padding:clamp(70px,10vw,110px) 0}
.pricing-hdr{text-align:center;margin-bottom:clamp(36px,5vw,56px)}
.pricing-hdr .sec-sub{margin:0 auto}
.plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.plan-card{background:var(--bg-card);border-radius:var(--r3);padding:clamp(24px,3vw,32px);border:1px solid var(--border-lt);position:relative;transition:transform .25s,box-shadow .25s;}
.plan-card:hover{transform:translateY(-4px);box-shadow:0 16px 44px rgba(0,0,0,.09)}
.plan-card.pop{border-color:var(--brand);border-width:1.5px;box-shadow:0 4px 24px rgba(18,151,253,.15);}
.pop-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--brand);color:#fff;padding:4px 16px;border-radius:100px;font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;box-shadow:0 2px 8px rgba(18,151,253,.35);}
.plan-icon{font-size:1.4rem;margin-bottom:12px}
.plan-name{font-family:var(--font-head);font-weight:800;font-size:1.1rem;color:var(--text-1);margin-bottom:4px}
.plan-desc{font-size:.82rem;color:var(--text-3);margin-bottom:20px;line-height:1.6}
.plan-limit{display:inline-flex;align-items:center;gap:6px;background:rgba(18,151,253,.07);border:1px solid rgba(18,151,253,.13);border-radius:7px;padding:5px 10px;font-family:var(--font-mono);font-size:.7rem;color:var(--brand);margin-bottom:22px;}
.plan-price{display:flex;align-items:flex-end;gap:3px;margin-bottom:22px}
.plan-cur{font-size:1rem;font-weight:600;color:var(--text-2);margin-bottom:6px}
.plan-num{font-family:var(--font-head);font-weight:800;font-size:2.8rem;color:var(--text-1);line-height:1;letter-spacing:-.04em}
.plan-per{font-size:.82rem;color:var(--text-3);margin-bottom:5px}
.plan-div{height:1px;background:var(--border-lt);margin-bottom:20px}
.plan-feats{list-style:none;margin-bottom:24px}
.plan-feats li{display:flex;gap:9px;align-items:flex-start;font-size:.875rem;color:var(--text-2);margin-bottom:9px;line-height:1.5}
.plan-feats li .fi{font-size:.8rem;flex-shrink:0;margin-top:1px}
.btn-plan{display:block;width:100%;padding:12px;text-align:center;border-radius:10px;font-weight:600;font-size:.9rem;text-decoration:none;font-family:var(--font-body);border:1.5px solid var(--brand);color:var(--brand);transition:all .22s;cursor:pointer;background:transparent;}
.btn-plan:hover{background:rgba(18,151,253,.05)}
.btn-plan.fill{background:var(--brand);color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba(18,151,253,.3)}
.btn-plan.fill:hover{background:var(--brand-dk);box-shadow:0 6px 22px rgba(18,151,253,.4)}
`;

const css9 = `
.faq-sec{padding:clamp(70px,10vw,110px) 0;background:var(--bg-alt)}
.faq-grid{display:grid;grid-template-columns:1fr 1.6fr;gap:clamp(40px,7vw,80px);align-items:start}
.faq-item{border-bottom:1px solid var(--border-lt)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:16px 0;cursor:pointer;font-weight:600;font-size:.9rem;color:var(--text-1);transition:color .2s;user-select:none;gap:16px;}
.faq-q:hover{color:var(--brand)}
.faq-arr{width:24px;height:24px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .25s;}
.faq-arr svg{width:11px;height:11px;stroke:var(--text-3);transition:transform .25s}
.faq-item.on .faq-arr{background:var(--brand);border-color:var(--brand)}
.faq-item.on .faq-arr svg{stroke:#fff;transform:rotate(45deg)}
.faq-a{max-height:0;overflow:hidden;font-size:.875rem;color:var(--text-2);line-height:1.75;transition:max-height .35s ease,padding .35s ease;padding:0}
.faq-item.on .faq-a{max-height:200px;padding-bottom:16px}
.cta-sec{padding:clamp(70px,10vw,100px) 0}
.cta-box{background:linear-gradient(135deg,#EBF5FF 0%,#F5FAFE 100%);border:1px solid rgba(18,151,253,.13);border-radius:var(--r4);padding:clamp(44px,7vw,72px) clamp(24px,6vw,80px);text-align:center;position:relative;overflow:hidden;}
.cta-box::before{content:'';position:absolute;top:-70px;right:-70px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(18,151,253,.07),transparent 70%);pointer-events:none;}
.cta-box::after{content:'';position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(139,202,249,.1),transparent 70%);pointer-events:none;}
.cta-h{font-family:var(--font-head);font-weight:800;font-size:clamp(1.8rem,3.5vw,2.7rem);line-height:1.1;letter-spacing:-.03em;color:var(--text-1);margin-bottom:14px;position:relative;z-index:1}
.cta-sub{font-size:.98rem;color:var(--text-2);margin-bottom:36px;position:relative;z-index:1}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:14px;position:relative;z-index:1;flex-wrap:wrap}
.btn-cta{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:100px;background:var(--brand);color:#fff;font-weight:700;font-size:1rem;text-decoration:none;font-family:var(--font-body);box-shadow:0 4px 20px rgba(18,151,253,.35);border:none;cursor:pointer;transition:all .24s;}
.btn-cta:hover{background:var(--brand-dk);transform:translateY(-2px);box-shadow:0 8px 30px rgba(18,151,253,.44)}
.cta-note{font-size:.8rem;color:var(--text-3);margin-top:16px;position:relative;z-index:1}
.cta-note span{margin:0 6px}
footer{border-top:1px solid var(--border-lt);padding:40px 0;background:var(--bg)}
.foot-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px}
.foot-logo{display:flex;align-items:center;gap:9px;text-decoration:none;font-family:var(--font-head);font-weight:800;font-size:1rem;color:var(--text-1)}
.foot-links{display:flex;gap:24px;flex-wrap:wrap}
.foot-links a{font-size:.82rem;color:var(--text-3);text-decoration:none;transition:color .2s}
.foot-links a:hover{color:var(--text-1)}
.foot-copy{font-size:.76rem;color:var(--text-3)}
@media(max-width:900px){
  .nav-links{display:none}.btn-pill{display:none}.btn-ghost{display:none}.ham{display:flex}
  .hero-grid,.wf-grid,.why-grid,.faq-grid{grid-template-columns:1fr}
  .hero-visual{display:none}.bento{grid-template-columns:1fr}.b-card.span2{grid-column:span 1}
  .track-inner{grid-template-columns:1fr}.met-grid{grid-template-columns:repeat(3,1fr)}
  .met-item:nth-child(4)::after,.met-item:nth-child(3)::after{display:none}
  .testi-grid{grid-template-columns:1fr}.plan-grid{grid-template-columns:1fr}
  .foot-row{flex-direction:column;align-items:flex-start}.fc{display:none}
}
@media(max-width:640px){
  .hero-btns{flex-direction:column;align-items:flex-start}.met-grid{grid-template-columns:repeat(2,1fr)}
  .dc-stats{grid-template-columns:repeat(2,1fr)}.met-item::after{display:none}
  .cta-box{padding:36px 24px}.ab-bars{grid-template-columns:1fr}.wf-grid{gap:28px}
}
@media(min-width:901px) and (max-width:1060px){
  .bento{grid-template-columns:1fr 1fr}.b-card.span2{grid-column:span 2}
}
`;



const html = `
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<nav id="nav">
  <div class="wrap">
    <div class="nav-row">
      <a href="/" class="logo">
        <div class="logo-gem"><svg viewBox="0 0 16 16" fill="none"><path d="M9 2L3 9h5l-1 5 6-7H8L9 2Z" fill="#fff" stroke="#fff" stroke-width=".4" stroke-linejoin="round"/></svg></div>
        MailBlast Pro
      </a>
      <ul class="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#why">Why Us</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>
      <div class="nav-right">
        <a href="#" class="btn-ghost">Login</a>
        <a href="#" class="btn-pill">Get Started Free</a>
        <button class="ham" id="ham" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>
    </div>
  </div>
  <div class="mobile-menu" id="mob">
    <a href="#features">Features</a>
    <a href="#why">Why Us</a>
    <a href="#pricing">Pricing</a>
    <a href="#faq">FAQ</a>
    <a href="#">Login</a>
    <a href="#" style="color:var(--brand);font-weight:700">Get Started Free →</a>
  </div>
</nav>
`;

const html2 = `
<section class="hero">
  <div class="wrap">
    <div class="hero-grid">
      <div>
        <div class="eyebrow"><span class="e-dot"></span>v3.4 — AI Warmup Sequences Now Live</div>
        <h1 class="hero-h1">Scale Your Cold<br>Outreach. <em>Without</em><br><span class="u-line">the Chaos.</span></h1>
        <p class="hero-sub">The ultimate intelligent engine for executing heavy-duty email campaigns — ensuring zero-stress delivery and precise, human-verified tracking at any scale.</p>
        <div class="hero-btns">
          <a href="#" class="btn-hero">Launch Your First Campaign <span class="arr">→</span></a>
          <a href="#" class="btn-demo">
            <span class="play-ring"><svg width="9" height="11" viewBox="0 0 9 11" fill="none"><path d="M1 1.5L8 5.5L1 9.5V1.5Z" fill="#1297FD" stroke="#1297FD" stroke-width=".4" stroke-linejoin="round"/></svg></span>
            Watch demo
          </a>
        </div>
        <div class="hero-trust">
          <div class="avatars"><i>AK</i><i>MJ</i><i>SR</i><i>+</i></div>
          <div class="trust-text"><div class="stars">★★★★★</div><strong>14,000+</strong> growth teams trust MailBlast Pro</div>
        </div>
        <div class="live-chip"><span class="l-dot"></span><span id="lcnt">2,847</span> emails sent in the last minute</div>
      </div>
      <div class="hero-visual">
        <div class="fc fc-l"><span class="fc-dot fc-g"></span><span class="fc-lbl">Delivery Rate</span><span class="fc-val">99.8%</span></div>
        <div class="fc fc-r"><span class="fc-dot fc-b"></span><span class="fc-lbl">Open Rate</span><span class="fc-val">42.3%</span></div>
        <div class="dash-card">
          <div class="dc-bar"><span class="d1"></span><span class="d2"></span><span class="d3"></span>
            <div class="dc-tabs"><span class="dc-tab on">Campaigns</span><span class="dc-tab">Analytics</span><span class="dc-tab">Settings</span></div>
          </div>
          <div class="dc-body">
            <div class="camp-hd"><span class="camp-title">Active Campaigns</span><button class="btn-new">+ New</button></div>
            <div class="cr"><div><div class="cr-name">Q4 SaaS Outreach</div><div class="cr-sent">12,400 recipients</div></div><div class="cr-rate">42.3%</div><div class="cr-rate" style="color:var(--brand)">18.7%</div><span class="cr-tag t-live">Live</span></div>
            <div class="cr"><div><div class="cr-name">Agency Cold Blast</div><div class="cr-sent">8,210 recipients</div></div><div class="cr-rate">38.1%</div><div class="cr-rate" style="color:var(--brand)">12.4%</div><span class="cr-tag t-que">Queued</span></div>
            <div class="cr"><div><div class="cr-name">SaaS Follow-Up Seq.</div><div class="cr-sent">5,990 recipients</div></div><div class="cr-rate">55.9%</div><div class="cr-rate" style="color:var(--brand)">24.1%</div><span class="cr-tag t-done">Done</span></div>
            <div class="dc-stats">
              <div class="dc-stat"><div class="ds-n">99<span>.8%</span></div><div class="ds-l">Delivery</div></div>
              <div class="dc-stat"><div class="ds-n">42<span>.3%</span></div><div class="ds-l">Open Rate</div></div>
              <div class="dc-stat"><div class="ds-n">18<span>.7%</span></div><div class="ds-l">Click Rate</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const html3 = `
<div class="ticker-wrap">
  <div class="ticker-lbl">Trusted by teams at</div>
  <div style="overflow:hidden">
    <div class="ticker-belt">
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>Nexlify</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Voltform</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>GrowthStack</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>Orbita Labs</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Clearpath IO</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Arcline Digital</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" stroke-width="3"/><line x1="15" y1="9" x2="15.01" y2="9" stroke-width="3"/></svg>Pulsewave</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>Nexlify</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Voltform</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>GrowthStack</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>Orbita Labs</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Clearpath IO</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Arcline Digital</div><span class="t-sep"></span>
      <div class="t-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>Pulsewave</div>
    </div>
  </div>
</div>
`;

const html4 = `
<section class="feat-section" id="features">
  <div class="wrap">
    <div class="feat-hdr rev">
      <div class="sec-tag">// core_features</div>
      <h2 class="sec-h">Everything Your Outreach Team Needs.</h2>
      <p class="sec-sub">Four pillars of serious email infrastructure — built for teams that can't afford to miss inbox.</p>
    </div>
    <div class="bento">
      <div class="b-card span2 rev">
        <div class="b-tag">Bulk Dispatch</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">
          <div>
            <div class="b-icon"><svg viewBox="0 0 24 24"><path d="M22 12H2M22 12l-4-4M22 12l-4 4M2 12l4-4M2 12l4 4"/></svg></div>
            <div class="b-name">Unstoppable Bulk Dispatch</div>
            <p class="b-desc">Upload massive ledgers and let intelligent delay intervals maintain your sender reputation absolutely pristine. Send millions without a single spam flag.</p>
          </div>
          <div class="dispatch-vis">
            <div class="dp-track">
              <div class="dp-fill" id="dpfill"></div>
              <div class="dp-dots">
                <div class="dp-dot lit" id="dp0"></div><div class="dp-dot" id="dp1"></div><div class="dp-dot" id="dp2"></div><div class="dp-dot" id="dp3"></div><div class="dp-dot" id="dp4"></div>
              </div>
            </div>
            <div class="dp-meta">
              <div class="dp-m"><label>delay_interval</label><span>45–120s (rand.)</span></div>
              <div class="dp-m"><label>batch_size</label><span>up to 500k/day</span></div>
              <div class="dp-m"><label>reputation</label><span style="color:#22C55E">A+ Score</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="b-card rev d1x">
        <div class="b-tag">Personalization</div>
        <div class="b-icon"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
        <div class="b-name">Dynamic Personalization</div>
        <p class="b-desc">Inject custom variables and intelligent attachments per recipient. Every email feels handcrafted — even at 50,000 sends.</p>
        <div class="code-block">
          <div><span class="ck">subject</span>: <span class="cv">"Hey {{first_name}},"</span></div>
          <div><span class="ck">attach</span>: <span class="cv">{{custom_deck}}</span></div>
          <div><span class="ck">sig</span>: <span class="cv">"{{sender_name}}"</span></div>
          <div><span class="cc">// per-recipient ✓</span></div>
        </div>
      </div>
      <div class="b-card rev d2x">
        <div class="b-tag">Tracking</div>
        <div class="b-icon"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
        <div class="b-name">Military-Grade Tracking</div>
        <p class="b-desc">Accurate human-level tracking with bot filtering. No more inflated numbers from scanners and crawlers.</p>
        <div class="track-inner">
          <div class="track-list">
            <div class="tr-row"><span class="tr-email bot">bot_preview@scanner.io</span><span class="tr-badge tb-bot">FILTERED</span></div>
            <div class="tr-row"><span class="tr-email">john@company.com</span><span class="tr-badge tb-human">✓ HUMAN</span></div>
            <div class="tr-row"><span class="tr-email">sarah@venture.co</span><span class="tr-badge tb-human">✓ HUMAN</span></div>
          </div>
          <div class="track-chart">
            <div class="bar-row"><div class="bar-lbl"><span>Delivery</span><span>99.8%</span></div><div class="bar-bg"><div class="bar-fg" data-w="99.8"></div></div></div>
            <div class="bar-row"><div class="bar-lbl"><span>Human Opens</span><span>42.3%</span></div><div class="bar-bg"><div class="bar-fg" data-w="42.3"></div></div></div>
            <div class="bar-row"><div class="bar-lbl"><span>Bots Filtered</span><span>100%</span></div><div class="bar-bg"><div class="bar-fg" data-w="100"></div></div></div>
          </div>
        </div>
      </div>
      <div class="b-card rev d1x">
        <div class="b-tag">Automation</div>
        <div class="b-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <div class="b-name">Set &amp; Forget Automation</div>
        <p class="b-desc">Master your outreach timeline with precision scheduling. Send while you sleep — timezone-aware, always.</p>
        <div class="sched-vis">
          <div class="sched-clock"><div class="clock-hand ch-s"></div><div class="clock-hand ch-m"></div></div>
          <div class="sched-rows">
            <div class="sched-r"><span class="sched-time">09:00</span><span class="sched-lbl">Morning blast</span><span class="sched-badge sb-live">LIVE</span></div>
            <div class="sched-r"><span class="sched-time">14:30</span><span class="sched-lbl">Follow-up sequence</span><span class="sched-badge sb-q">QUEUE</span></div>
          </div>
        </div>
      </div>
      <div class="b-card rev d2x">
        <div class="b-tag">A/B Testing</div>
        <div class="b-icon"><svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>
        <div class="b-name">A/B Split Testing</div>
        <p class="b-desc">Test subject lines, CTAs, and send windows. Auto-promote the winner once statistical significance is hit.</p>
        <div class="ab-vis">
          <div class="ab-bars">
            <div class="ab-bar-wrap"><div class="ab-label">Variant A</div><div class="ab-pct" id="abA">38.2%</div><div class="ab-bg"><div class="ab-fg ab-a" data-w="38.2"></div></div></div>
            <div class="ab-bar-wrap"><div class="ab-label">Variant B</div><div class="ab-pct" id="abB">51.7%</div><div class="ab-bg"><div class="ab-fg ab-b" data-w="51.7"></div></div></div>
          </div>
          <div class="ab-win">🏆 Variant B is winning — auto-promote ready</div>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const html5 = `
<div class="metrics-band">
  <div class="wrap">
    <div class="met-grid">
      <div class="met-item"><div class="met-n">99.8%</div><div class="met-l">Avg. Delivery Rate</div></div>
      <div class="met-item"><div class="met-n">500K+</div><div class="met-l">Emails Sent Daily</div></div>
      <div class="met-item"><div class="met-n">14K+</div><div class="met-l">Growth Teams</div></div>
      <div class="met-item"><div class="met-n">100%</div><div class="met-l">Human-Verified Opens</div></div>
      <div class="met-item"><div class="met-n">&lt;60s</div><div class="met-l">Upload to Sent</div></div>
    </div>
  </div>
</div>
<section class="workflow-sec">
  <div class="wrap">
    <div class="wf-grid">
      <div>
        <div class="sec-tag rev">// how_it_works</div>
        <h2 class="sec-h rev">From Upload to<br>Inbox in Minutes.</h2>
        <p class="sec-sub rev">No developer required. No complex setup. Just results from minute one.</p>
        <div class="wf-steps">
          <div class="wf-step rev"><div class="wf-num">1</div><div class="wf-body"><h4>Upload Your Ledger</h4><p>Drop a CSV or connect your CRM. MailBlast validates every address and enriches missing fields automatically.</p></div></div>
          <div class="wf-step rev d1x"><div class="wf-num">2</div><div class="wf-body"><h4>Configure Your Campaign</h4><p>Set variables, attach personalised assets, choose your sender identity and warm-up profile.</p></div></div>
          <div class="wf-step rev d2x"><div class="wf-num">3</div><div class="wf-body"><h4>Schedule &amp; Launch</h4><p>Pick your send window. Intelligent throttling and retry logic handle the rest.</p></div></div>
          <div class="wf-step rev d3x"><div class="wf-num">4</div><div class="wf-body"><h4>Track Real Results</h4><p>Bot-filtered, human-verified analytics update in real time. Export to any BI tool or use the built-in dashboard.</p></div></div>
        </div>
      </div>
      <div class="rev d1x">
        <div class="term">
          <div class="term-bar"><span class="d1"></span><span class="d2"></span><span class="d3"></span><span class="term-title">mailblast — campaign.json</span></div>
          <div class="term-code">
<span class="tc-c">// Campaign configuration</span>
<span class="tc-m">{</span>
  <span class="tc-k">"campaign"</span><span class="tc-m">:</span> <span class="tc-s">"Q4 SaaS Outreach"</span><span class="tc-m">,</span>
  <span class="tc-k">"recipients"</span><span class="tc-m">:</span> <span class="tc-n">12400</span><span class="tc-m">,</span>
  <span class="tc-k">"sender"</span><span class="tc-m">: {</span>
    <span class="tc-k">"name"</span><span class="tc-m">:</span> <span class="tc-s">"{{first_name}} at Nexlify"</span><span class="tc-m">,</span>
    <span class="tc-k">"warmup"</span><span class="tc-m">:</span> <span class="tc-b">true</span>
  <span class="tc-m">},</span>
  <span class="tc-k">"scheduling"</span><span class="tc-m">: {</span>
    <span class="tc-k">"window"</span><span class="tc-m">:</span> <span class="tc-s">"09:00–11:30"</span><span class="tc-m">,</span>
    <span class="tc-k">"timezone"</span><span class="tc-m">:</span> <span class="tc-s">"recipient_local"</span><span class="tc-m">,</span>
    <span class="tc-k">"throttle"</span><span class="tc-m">:</span> <span class="tc-s">"intelligent"</span>
  <span class="tc-m">},</span>
  <span class="tc-k">"tracking"</span><span class="tc-m">: {</span>
    <span class="tc-k">"bot_filter"</span><span class="tc-m">:</span> <span class="tc-b">true</span><span class="tc-m">,</span>
    <span class="tc-k">"human_opens"</span><span class="tc-m">:</span> <span class="tc-b">true</span>
  <span class="tc-m">}</span>
<span class="tc-m">}</span>

<span class="tc-c">// Dispatching... ✓ Ready</span>
<span class="tc-b">$</span> <span class="tc-k">mailblast deploy --env</span> <span class="tc-s">production</span><span class="caret"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const html6 = `
<section class="why-sec" id="why">
  <div class="wrap">
    <div class="why-grid">
      <div>
        <div class="sec-tag rev">// why_mailblast</div>
        <h2 class="sec-h rev">Engineered for<br>Conversion.</h2>
        <p class="sec-sub rev">We didn't build another bulk mailer. We built the infrastructure your growth team actually deserves.</p>
        <div class="chk-list">
          <div class="chk-item rev"><div class="chk-ic">🚫</div><div class="chk-body"><h4>No limits on sending logic</h4><p>Sequence rules, conditional branches, custom delays — your logic, your rules.</p></div></div>
          <div class="chk-item rev d1x"><div class="chk-ic">🎯</div><div class="chk-body"><h4>No hidden tracking inaccuracies</h4><p>Our bot-filtering engine ensures every metric reflects a real human action.</p></div></div>
          <div class="chk-item rev d2x"><div class="chk-ic">⚡</div><div class="chk-body"><h4>Blazing fast execution</h4><p>From upload to sent in under 60 seconds. Our distributed infra never makes you wait.</p></div></div>
        </div>
      </div>
      <div class="rev d1x">
        <div class="comp-tbl">
          <div class="ct-hd"><div>Feature</div><div class="p-col">MailBlast Pro</div><div>Others</div></div>
          <div class="ct-r"><span class="ct-f">Human-verified tracking</span><span class="ct-c cy">✓</span><span class="ct-c cn2">✗</span></div>
          <div class="ct-r"><span class="ct-f">Intelligent send delays</span><span class="ct-c cy">✓</span><span class="ct-c cn2">✗</span></div>
          <div class="ct-r"><span class="ct-f">Per-recipient attachments</span><span class="ct-c cy">✓</span><span class="ct-c cn2">✗</span></div>
          <div class="ct-r"><span class="ct-f">Precision scheduler</span><span class="ct-c cy">✓</span><span class="ct-c cm">~</span></div>
          <div class="ct-r"><span class="ct-f">No sending caps</span><span class="ct-c cy">✓</span><span class="ct-c cn2">✗</span></div>
          <div class="ct-r"><span class="ct-f">A/B testing + auto-promote</span><span class="ct-c cy">✓</span><span class="ct-c cn2">✗</span></div>
          <div class="ct-r"><span class="ct-f">A+ Sender reputation tools</span><span class="ct-c cy">✓</span><span class="ct-c cn2">✗</span></div>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="testi-sec">
  <div class="wrap">
    <div class="testi-hdr rev">
      <div class="sec-tag">// social_proof</div>
      <h2 class="sec-h">What Growth Teams Say.</h2>
    </div>
    <div class="testi-grid">
      <div class="testi-card rev">
        <div class="t-stars">★★★★★</div>
        <p class="t-text">"We went from 68% delivery rates with our old tool to 99.6% in the first week. The bot filtering completely changed how I trust our open data."</p>
        <div class="t-auth"><div class="t-av">AR</div><div><div class="t-name">Alex Ramos</div><div class="t-role">Head of Growth, Nexlify</div></div></div>
      </div>
      <div class="testi-card rev d1x">
        <div class="t-stars">★★★★★</div>
        <p class="t-text">"MailBlast Pro handles 80,000 recipient campaigns without breaking a sweat. Intelligent throttling kept our sender score above 95 the entire quarter."</p>
        <div class="t-auth"><div class="t-av" style="background:linear-gradient(135deg,#70C8F8,#1297FD)">SK</div><div><div class="t-name">Sarah Kim</div><div class="t-role">VP Marketing, Orbita Labs</div></div></div>
      </div>
      <div class="testi-card rev d2x">
        <div class="t-stars">★★★★★</div>
        <p class="t-text">"Setup took 12 minutes. Our first campaign landed 44% open rates. The dynamic per-attachment logic is unlike anything else on the market."</p>
        <div class="t-auth"><div class="t-av" style="background:linear-gradient(135deg,#AAD8FB,#40AAF8)">MJ</div><div><div class="t-name">Marcus Johnson</div><div class="t-role">Founder, GrowthStack</div></div></div>
      </div>
    </div>
  </div>
</section>
`;

const html7 = `
<section class="pricing-sec" id="pricing">
  <div class="wrap">
    <div class="pricing-hdr rev">
      <div class="sec-tag">// pricing</div>
      <h2 class="sec-h">Simple, Honest Pricing.</h2>
      <p class="sec-sub">Start free. Scale when you're ready. No hidden fees, ever.</p>
    </div>
    <div class="plan-grid">
      <div class="plan-card rev">
        <div class="plan-icon">🌱</div>
        <div class="plan-name">Free — Starter</div>
        <div class="plan-desc">For individuals and beginners who need to test the system before committing.</div>
        <div class="plan-limit">Up to 500 cold emails / day</div>
        <div class="plan-price"><span class="plan-cur">$</span><span class="plan-num">0</span><span class="plan-per">/month</span></div>
        <div class="plan-div"></div>
        <ul class="plan-feats">
          <li><span class="fi">🚫</span>No attachment support</li>
          <li><span class="fi">✅</span>Standard delivery network</li>
          <li><span class="fi">✅</span>Basic open tracking (1× count)</li>
          <li><span class="fi">✅</span>Campaign composer access</li>
          <li><span class="fi">✅</span>CSV / Excel ledger uploads</li>
          <li><span class="fi">✅</span>Single email dispatch mode</li>
          <li><span class="fi">⏳</span>Pre-set delays (15s &amp; 30s only)</li>
        </ul>
        <a href="#" class="btn-plan">Get Started Free</a>
      </div>
      <div class="plan-card pop rev d1x">
        <div class="pop-badge">Most Popular</div>
        <div class="plan-icon">🚀</div>
        <div class="plan-name">Basic — Growth</div>
        <div class="plan-desc">For small agencies, independent recruiters, and freelancers. Ultimate value.</div>
        <div class="plan-limit">Up to 1,000 cold emails / day</div>
        <div class="plan-price"><span class="plan-cur">$</span><span class="plan-num">9.99</span><span class="plan-per">/month</span></div>
        <div class="plan-div"></div>
        <ul class="plan-feats">
          <li><span class="fi">📁</span>Unlimited file attachments (no size limit)</li>
          <li><span class="fi">✅</span>High-priority delivery network</li>
          <li><span class="fi">✅</span>100% verified open tracking (blocks bot previews)</li>
          <li><span class="fi">✅</span>Real-time dashboard analytics &amp; logs</li>
          <li><span class="fi">✅</span>Dynamic variable reconstruction (name, company…)</li>
          <li><span class="fi">✅</span>Set &amp; forget campaign scheduler</li>
          <li><span class="fi">⚡</span>Advanced throttle control (custom delays)</li>
        </ul>
        <a href="#" class="btn-plan fill">Start Growth Plan</a>
      </div>
      <div class="plan-card rev d2x">
        <div class="plan-icon">👑</div>
        <div class="plan-name">Pro — God Mode</div>
        <div class="plan-desc">For heavy-duty performance marketing teams, SaaS founders, and volume senders.</div>
        <div class="plan-limit" style="background:rgba(168,85,247,.07);border-color:rgba(168,85,247,.2);color:#7C3AED">♾️ Unlimited emails / day</div>
        <div class="plan-price"><span class="plan-cur">$</span><span class="plan-num">19.99</span><span class="plan-per">/month</span></div>
        <div class="plan-div"></div>
        <ul class="plan-feats">
          <li><span class="fi">🗂️</span>Unlimited mass dynamic attachments</li>
          <li><span class="fi">✅</span>Multi-account rotation / warm-up ready <em style="font-size:.72rem;color:var(--text-3)">(upcoming)</em></li>
          <li><span class="fi">✅</span>100% bypass filtering (ISP &amp; spam scanner blockers)</li>
          <li><span class="fi">✅</span>Live WebSocket telemetry (see opens in milliseconds)</li>
          <li><span class="fi">✅</span>Sub-account management &amp; multi-email row expansions</li>
          <li><span class="fi">✅</span>Unlimited ledger capacity &amp; processing</li>
          <li><span class="fi">🤖</span>Access to AI Studio</li>
        </ul>
        <a href="#" class="btn-plan">Activate God Mode</a>
      </div>
    </div>
  </div>
</section>
`;

const html8 = `
<section class="faq-sec" id="faq">
  <div class="wrap">
    <div class="faq-grid">
      <div>
        <div class="sec-tag rev">// faq</div>
        <h2 class="sec-h rev">Questions?<br>We've Got<br>Answers.</h2>
        <p class="sec-sub rev" style="margin-top:14px">Can't find what you're looking for? Reach out directly.</p>
        <a href="#" class="btn-pill" style="margin-top:28px;display:inline-flex">Contact Support</a>
      </div>
      <div class="rev d1x">
        <div class="faq-item">
          <div class="faq-q">How does MailBlast maintain sender reputation at scale?<span class="faq-arr"><svg viewBox="0 0 12 12" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v8M2 6h8"/></svg></span></div>
          <div class="faq-a">Our intelligent throttling calculates the optimal send rate per identity based on domain history, volume, and inbox placement scores. Delays, warm-up curves, and retry logic are handled automatically.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">What does "human-verified tracking" actually mean?<span class="faq-arr"><svg viewBox="0 0 12 12" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v8M2 6h8"/></svg></span></div>
          <div class="faq-a">We fingerprint each open and click against 40+ behavioral signals — mouse movement, dwell time, user agent patterns, IP classification — to remove bot traffic. What you see is only real human activity.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">Can I upload different attachments for each recipient?<span class="faq-arr"><svg viewBox="0 0 12 12" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v8M2 6h8"/></svg></span></div>
          <div class="faq-a">Yes. Add an attachment_url column in your CSV or map it from your CRM. MailBlast fetches, caches, and attaches the correct file for each recipient before dispatch — available on Basic and Pro plans.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">What's the difference between Basic and Pro?<span class="faq-arr"><svg viewBox="0 0 12 12" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v8M2 6h8"/></svg></span></div>
          <div class="faq-a">Basic is capped at 1,000 emails/day and covers the essentials perfectly. Pro removes all sending limits, adds live WebSocket telemetry, sub-account management, ISP bypass filtering, and access to the AI Studio.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">Is there an API for custom integrations?<span class="faq-arr"><svg viewBox="0 0 12 12" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v8M2 6h8"/></svg></span></div>
          <div class="faq-a">Full REST API and webhooks are available on Basic and Pro plans. Native integrations with Salesforce, HubSpot, and Zapier are included. Custom enterprise integrations available on request.</div>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="cta-sec">
  <div class="wrap">
    <div class="cta-box rev">
      <div class="sec-tag" style="justify-content:center;display:flex;margin-bottom:12px">// ready_to_dominate</div>
      <h2 class="cta-h">Ready to Dominate<br>Your Inbox Placement?</h2>
      <p class="cta-sub">Join 14,000+ teams already running scalable, precision outreach with MailBlast Pro.</p>
      <div class="cta-btns"><a href="#" class="btn-cta">Start Blasting Now →</a></div>
      <p class="cta-note">No credit card required <span>·</span> Setup in under 5 minutes <span>·</span> Cancel anytime</p>
    </div>
  </div>
</section>
<footer>
  <div class="wrap">
    <div class="foot-row">
      <a href="/" class="foot-logo">
        <div class="logo-gem" style="width:26px;height:26px;border-radius:7px"><svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px"><path d="M9 2L3 9h5l-1 5 6-7H8L9 2Z" fill="#fff" stroke="#fff" stroke-width=".4" stroke-linejoin="round"/></svg></div>
        MailBlast Pro
      </a>
      <div class="foot-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Documentation</a>
        <a href="#">Status</a>
        <a href="#">Contact</a>
      </div>
      <div class="foot-copy">© 2025 MailBlast Pro, Inc.</div>
    </div>
  </div>
</footer>
`;
