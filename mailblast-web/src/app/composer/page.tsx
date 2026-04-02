'use client';

import { useState, useEffect } from 'react';
import CampaignEditor from '@/components/CampaignEditor';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Target, XCircle, Clock } from 'lucide-react';

export default function Composer() {
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [campaignProgress, setCampaignProgress] = useState<any>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);

  useEffect(() => {
    let interval: any;
    if (activeCampaignId && (!campaignProgress || campaignProgress.status === 'running')) {
      const pollData = () => {
        if (document.hidden) return; // Don't poll when tab is not visible
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/campaigns/${activeCampaignId}`).then(res => res.json()).then(data => setCampaignProgress(data)).catch(err => console.error(err));
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/send-log?campaign_id=${activeCampaignId}&limit=100`).then(res => res.json()).then(data => setLiveLogs(data.log || [])).catch(err => console.error(err));
      };
      pollData(); // Immediate first fetch
      interval = setInterval(pollData, 5000);
    }
    return () => clearInterval(interval);
  }, [activeCampaignId, campaignProgress]);

  if (activeCampaignId && campaignProgress) {
    const total = campaignProgress.total || 0;
    const sent = campaignProgress.sent_count || 0;
    const failed = campaignProgress.failed_count || 0;
    const processed = sent + failed;
    const pending = total - processed;
    const isCompleted = campaignProgress.status === 'completed';
    const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

    return (
      <div className="space-y-8 max-w-[1000px] mx-auto mt-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-[#E8E9EC] rounded-2xl p-10 text-center shadow-sm">
          <div className="flex items-center justify-center mb-6">
            {isCompleted ? (
              <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,.1)] flex items-center justify-center border-2 border-[#22C55E]">
                <CheckCircle size={40} className="text-[#22C55E]" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-[rgba(18,151,253,.08)] flex items-center justify-center border-2 border-[#1297FD]">
                <Loader2 size={40} className="text-[#1297FD] animate-spin" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#0C0D10] mb-2">{isCompleted ? 'Campaign Completed' : 'Sending in Progress...'}</h1>
          <p className="text-[#8D909C] mb-10">Campaign ID #{activeCampaignId} — {campaignProgress.name}</p>

          <div className="w-full h-3 bg-[#F2F3F5] rounded-full overflow-hidden mb-8 border border-[#E8E9EC]">
            <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[#22C55E]' : 'bg-[#1297FD]'}`} style={{ width: `${percent}%` }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-[#F2F3F5] p-5 rounded-xl border border-[#E8E9EC]">
              <div className="text-[#8D909C] text-xs font-bold font-mono mb-2 flex items-center gap-2 justify-center"><Target size={14} /> Total</div>
              <div className="text-3xl font-bold text-[#0C0D10]">{total}</div>
            </div>
            <div className="bg-[#F2F3F5] p-5 rounded-xl border border-[#E8E9EC]">
              <div className="text-xs font-bold font-mono mb-2 flex items-center gap-2 justify-center text-[#22C55E]"><CheckCircle size={14} /> Sent</div>
              <div className="text-3xl font-bold text-[#22C55E]">{sent}</div>
            </div>
            <div className="bg-[#F2F3F5] p-5 rounded-xl border border-[#E8E9EC]">
              <div className="text-xs font-bold font-mono mb-2 flex items-center gap-2 justify-center text-[#EF4444]"><XCircle size={14} /> Failed</div>
              <div className="text-3xl font-bold text-[#EF4444]">{failed}</div>
            </div>
            <div className="bg-[#F2F3F5] p-5 rounded-xl border border-[#E8E9EC]">
              <div className="text-xs font-bold font-mono mb-2 flex items-center gap-2 justify-center text-[#F59E0B]"><Clock size={14} /> Pending</div>
              <div className="text-3xl font-bold text-[#F59E0B]">{pending}</div>
            </div>
          </div>

          <div className="p-4 h-[280px] overflow-y-auto space-y-1 font-mono text-xs text-left bg-[#F2F3F5] border border-[#E8E9EC] rounded-xl custom-scrollbar">
            {liveLogs.length === 0 && !isCompleted && (
              <div className="flex items-center justify-center h-full text-[#8D909C]">
                Waiting for dispatch results...
              </div>
            )}
            {[...liveLogs].reverse().map((log) => (
              <div key={log.id} className="flex justify-between items-center p-2 border-b border-[#E8E9EC]">
                <span className={log.status === 'sent' ? 'text-[#22C55E]' : 'text-[#EF4444]'}>{log.recipient}</span>
                <span className="text-[#8D909C]">{log.sent_at ? new Date(log.sent_at + 'Z').toLocaleTimeString() : '—'}</span>
              </div>
            ))}
          </div>

          {isCompleted && (
            <button onClick={() => { setActiveCampaignId(null); setCampaignProgress(null); }}
              className="mt-8 px-8 py-3 rounded-lg border border-[#D8DADF] hover:bg-[#F2F3F5] text-[#474A56] font-semibold transition-colors">
              New Campaign
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-[#0C0D10]">Campaign Composer</h1>
        <p className="text-[#8D909C] mt-1 text-sm">Draft, preview, configure, and launch mass blasts seamlessly.</p>
      </div>
      <CampaignEditor mode="instant" onSuccess={(id) => setActiveCampaignId(id)} />
    </div>
  );
}
