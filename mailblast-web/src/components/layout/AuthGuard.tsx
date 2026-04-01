'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isEmailVerified, signOut, resendVerification } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-[12px] bg-[#1297FD] flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 2px 10px rgba(18,151,253,.35)' }}>
            <svg viewBox="0 0 16 16" fill="none" width="20" height="20">
              <path d="M9 2L3 9h5l-1 5 6-7H8L9 2Z" fill="#fff" stroke="#fff" strokeWidth=".4" strokeLinejoin="round"/>
            </svg>
          </div>
          <Loader2 size={24} className="text-[#1297FD] animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#8D909C] font-mono">Authenticating...</p>
        </motion.div>
      </div>
    );
  }

  // Not logged in 
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Logged in but email NOT verified
  if (!isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[440px] bg-white border border-[#E8E9EC] rounded-2xl p-8 shadow-sm text-center"
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B] rounded-t-2xl" />

          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,158,11,.08)] border border-[rgba(245,158,11,.18)] flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-[#F59E0B]" />
          </div>

          <h2 className="text-xl font-bold text-[#0C0D10] mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Verify Your Email
          </h2>
          <p className="text-sm text-[#474A56] mb-6 leading-relaxed">
            We sent a verification link to <strong className="text-[#0C0D10]">{user.email}</strong>. 
            Please check your inbox and click the link to activate your account.
          </p>

          <div className="bg-[#F2F3F5] rounded-xl p-4 mb-6 border border-[#E8E9EC]">
            <div className="flex items-center gap-2 text-xs text-[#8D909C] font-mono">
              <Shield size={14} />
              <span>Email verification is required for security</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={async () => {
                if (user.email) {
                  await resendVerification(user.email);
                }
              }}
              className="w-full bg-[#1297FD] text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-[#0A82E0] transition-colors shadow-sm"
            >
              Resend Verification Email
            </button>
            <button
              onClick={() => signOut()}
              className="w-full bg-transparent text-[#474A56] font-medium text-sm px-5 py-3 rounded-lg border border-[#D8DADF] hover:bg-[#F2F3F5] transition-colors"
            >
              Sign Out & Go Back
            </button>
          </div>

          <p className="text-xs text-[#8D909C] mt-6">
            Didn't receive the email? Check your spam folder or try a different email address.
          </p>
        </motion.div>
      </div>
    );
  }

  // Authenticated + verified → show the app
  return <>{children}</>;
}
