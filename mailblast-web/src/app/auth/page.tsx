'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft, KeyRound, User, Zap, Shield, Cpu, Layers } from 'lucide-react';
import './auth.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);

  // Core Auth State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const { signIn, signUp, signInWithGoogle, resetPassword, session, supabase } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Detect password recovery flow from URL hash
    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        setRecoveryMode(true);
        setForgotMode(false);
      }
    };
    handleHash();
    
    if (session && !recoveryMode) {
      router.push('/dashboard');
    }
  }, [session, router, recoveryMode]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('Password updated successfully! You can now sign in.');
      setRecoveryMode(false);
      setIsLogin(true);
      setNewPassword('');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccessMsg('');
    
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }


    setLoading(true);

    if (isLogin) {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
      }
    } else {
      // Pass names if backend supported, but current AuthContext doesn't. 
      // We keep it compatible with existing logic.
      const res = await signUp(email, password);
      if (res.error) {
        setError(res.error);
      } else if (res.needsVerification) {
        setSuccessMsg('Account created! Please check your email to verify your account.');
        setIsLogin(true);
        setPassword('');
      } else {
        router.push('/dashboard');
      }
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(email);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg('Password reset link sent! Check your email inbox for instructions.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const res = await signInWithGoogle();
    if (res.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  const checkPwdStrength = (val: string) => {
    if (val.length === 0) {
      setPwdStrength(0);
      return;
    }
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setPwdStrength(score);
  };

  return (
    <div className="auth-layout">
      {/* ══════════════════════════════════
           LEFT — Brand panel
      ══════════════════════════════════ */}
      <div className="left-panel">
        <div className="lp-top">
          {/* Logo */}
          <div className="brand-row cursor-pointer" onClick={() => router.push('/')}>
            <div className="brand-icon">
              <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L4 9.5H8.5L7.5 16L14 8.5H9.5L10 2Z"/>
              </svg>
            </div>
            <div className="brand-wordmark">MailBlast <span>OMEGA</span></div>
          </div>

          {/* Headline */}
          <div className="lp-headline">
            <motion.h1 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Enterprise email<br/>outreach, redefined.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              A high-performance, multi-tenant platform built for teams who refuse to compromise on deliverability, precision, or scale.
            </motion.p>
          </div>

          {/* Feature list */}
          <div className="feature-list">
            {[
              { icon: Layers, title: "Parallel SMTP Dispatch", desc: "8-thread pool with per-account staggering — max throughput, zero provider blocks." },
              { icon: Shield, title: "5-Layer Ghost-Open Protection", desc: "IP fingerprinting, ISP scan block, sender cooldown, proxy detection, burst filtering." },
              { icon: Cpu, title: "LLaMA 3.3 70B AI Personalisation", desc: "Dynamic variable reconstruction per recipient. Zero templates. Human-quality copy at scale." },
              { icon: Lock, title: "Ironclad Multi-Tenant Isolation", desc: "Every query scoped to your account. Your data never touches another account." },
              { icon: Zap, title: "Live WebSocket Telemetry", desc: "Real-time dispatch stream. Opens tracked in milliseconds, not minutes." }
            ].map((feat, i) => (
              <motion.div 
                key={feat.title} 
                className="feat-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
              >
                <div className="feat-icon-wrap">
                  <feat.icon size={15} />
                </div>
                <div className="feat-body">
                  <div className="feat-title">{feat.title}</div>
                  <div className="feat-desc">{feat.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div 
          className="lp-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="lp-stat">
            <div className="lp-stat-val">8×</div>
            <div className="lp-stat-label">Parallel threads</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-val">5-L</div>
            <div className="lp-stat-label">Open tracking</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-val">AES</div>
            <div className="lp-stat-label">Fernet encryption</div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════
           RIGHT — Auth card
      ══════════════════════════════════ */}
      <div className="right-panel">
        {/* ─── Back Nav (Repositioned to Right Panel for Desktop) ─── */}
        <div className="back-nav">
          <button 
            className="btn-back"
            onClick={() => router.push('/')}
          >
            <ArrowLeft />
            Back to Home
          </button>
        </div>

        <div className="auth-card">
          {/* Tabs */}
          {!forgotMode && !recoveryMode && (
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${isLogin ? 'active' : ''}`} 
                onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
              >
                Sign in
              </button>
              <button 
                className={`auth-tab ${!isLogin ? 'active' : ''}`} 
                onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
              >
                Create account
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {recoveryMode ? (
              <motion.div key="recovery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="form-panel">
                <div className="auth-head">
                  <h2>Set New Password</h2>
                  <p>Enter your new strong password below.</p>
                </div>
                
                {error && <div className="error-notice show mb-4"><AlertCircle size={16} /><p>{error}</p></div>}
                {successMsg && <div className="verify-notice show mb-4"><CheckCircle2 size={16} /><p><strong>Success!</strong> {successMsg}</p></div>}

                <form onSubmit={handleUpdatePassword} className="auth-form">
                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <div className="field-wrap has-toggle">
                      <Lock className="field-icon" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="field-input" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••" required 
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                        <svg viewBox="0 0 16 16"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinecap="round"/><circle cx="8" cy="8" r="2" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <div className="spinner" /> : <><CheckCircle2 size={15} /> Update Password</>}
                  </button>
                </form>
              </motion.div>
            ) : forgotMode ? (
              <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="form-panel">
                <div className="auth-head">
                  <h2>Reset Password</h2>
                  <p>Enter your email to receive a reset link.</p>
                </div>

                {error && <div className="error-notice show mb-4"><AlertCircle size={16} /><p>{error}</p></div>}
                {successMsg && <div className="verify-notice show mb-4"><CheckCircle2 size={16} /><p><strong>Success!</strong> {successMsg}</p></div>}

                <form onSubmit={handleForgotPassword} className="auth-form">
                  <div className="field-group">
                    <label className="field-label">Work email</label>
                    <div className="field-wrap">
                      <Mail className="field-icon" />
                      <input type="email" className="field-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <div className="spinner" /> : <><KeyRound size={15} /> Send Reset Link</>}
                  </button>
                  <div className="auth-footer">
                    <p><a href="#" onClick={() => { setForgotMode(false); setSuccessMsg(''); setError(''); }}>Back to Sign in</a></p>
                  </div>
                </form>
              </motion.div>
            ) : isLogin ? (
              <motion.div key="signin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="form-panel">
                <div className="auth-head">
                  <h2>Welcome back</h2>
                  <p>Sign in to your OMEGA workspace.</p>
                </div>

                {error && <div className="error-notice show mb-4"><AlertCircle size={16} /><p>{error}</p></div>}
                {successMsg && <div className="verify-notice show mb-4"><CheckCircle2 size={16} /><p><strong>Success!</strong> {successMsg}</p></div>}

                <button className="btn-oauth" onClick={handleGoogle}>
                  <svg className="oauth-icon" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>

                <div className="auth-divider"><span>or sign in with email</span></div>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label className="field-label">Work email</label>
                    <div className="field-wrap">
                      <Mail className="field-icon" />
                      <input type="email" className="field-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
                    </div>
                  </div>

                  <div className="field-group">
                    <div className="field-meta">
                      <label className="field-label">Password</label>
                      <a href="#" className="forgot-link" onClick={() => setForgotMode(true)}>Forgot password?</a>
                    </div>
                    <div className="field-wrap has-toggle">
                      <Lock className="field-icon" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="field-input" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required 
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                        <svg viewBox="0 0 16 16"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinecap="round"/><circle cx="8" cy="8" r="2" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="checkbox-row" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`checkbox-custom ${rememberMe ? 'checked' : ''}`}>
                      <svg viewBox="0 0 10 10"><polyline points="1.5,5 4,8 8.5,2"/></svg>
                    </div>
                    <span className="checkbox-label">Keep me signed in for 30 days</span>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <div className="spinner" /> : <><ArrowRight size={15} /> Sign in to workspace</>}
                  </button>
                </form>
                
                <div className="auth-footer">
                  <p>Don't have an account? <a href="#" onClick={() => setIsLogin(false)}>Create one free</a></p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="signup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="form-panel">
                <div className="auth-head">
                  <h2>Start your free account</h2>
                  <p>Full access. No credit card. Verified email required.</p>
                </div>

                <div className="tech-badges">
                  <span className="badge badge-blue">Multi-tenant SaaS</span>
                  <span className="badge badge-green">Free to start</span>
                  <span className="badge badge-amber">Email verification</span>
                </div>

                {error && <div className="error-notice show mb-4"><AlertCircle size={16} /><p>{error}</p></div>}
                {successMsg && <div className="verify-notice show mb-4"><CheckCircle2 size={16} /><p><strong>Success!</strong> {successMsg}</p></div>}

                <button className="btn-oauth" onClick={handleGoogle}>
                  <svg className="oauth-icon" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign up with Google
                </button>

                <div className="auth-divider"><span>or register with email</span></div>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">First name</label>
                      <div className="field-wrap">
                        <User className="field-icon" />
                        <input type="text" className="field-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Alex" required />
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Last name</label>
                      <div className="field-wrap">
                        <User className="field-icon" />
                        <input type="text" className="field-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Morgan" required />
                      </div>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Work email</label>
                    <div className="field-wrap">
                      <Mail className="field-icon" />
                      <input type="email" className="field-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Password</label>
                    <div className="field-wrap has-toggle">
                      <Lock className="field-icon" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="field-input" 
                        value={password}
                        onChange={e => { setPassword(e.target.value); checkPwdStrength(e.target.value); }}
                        placeholder="Min. 8 characters" required 
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                        <svg viewBox="0 0 16 16"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinecap="round"/><circle cx="8" cy="8" r="2" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                    <div className="pwd-strength">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`pwd-bar ${pwdStrength >= i ? (pwdStrength <= 2 ? 'weak' : pwdStrength === 3 ? 'medium' : 'strong') : ''}`} />
                      ))}
                    </div>
                    <p className={`field-hint ${pwdStrength >= 4 ? 'ok' : pwdStrength >= 1 ? '' : 'err'}`}>
                      {pwdStrength >= 4 ? 'Strong password ✓' : pwdStrength >= 1 ? 'Keep going...' : 'Use 8+ characters with numbers and symbols.'}
                    </p>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <div className="spinner" /> : <><Layers size={15} /> Create workspace</>}
                  </button>
                </form>

                <div className="security-strip">
                  <Shield size={14} />
                  <p>New accounts are <strong>fully isolated</strong>. Your data is scoped per User ID. Zero cross-tenant data exposure.</p>
                </div>

                <div className="auth-footer">
                  <p>Already have an account? <a href="#" onClick={() => setIsLogin(true)}>Sign in</a></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
