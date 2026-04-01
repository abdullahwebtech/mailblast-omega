'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, XCircle, Target, Mail, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LogType {
  id: number; recipient: string; status: string; error_msg: string | null;
  sent_at: string; opened?: number; open_count?: number;
}

export default function CampaignDetails({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<any>(null);
  const [logs, setLogs] = useState<LogType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/campaigns/${params.id}`).then(res => res.json()).then(data => setCampaign(data));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/send-log?campaign_id=${params.id}&limit=5000`).then(res => res.json()).then(data => setLogs(data.log || []));
  };

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/campaign/${params.id}/${action}`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/live-log`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.campaign_id === Number(params.id)) {
          if (data.type === 'opened') { setLogs(prev => prev.map(log => log.id === data.log_id ? { ...log, opened: 1, open_count: data.open_count } : log)); }
          else if (data.type === 'sent' || data.type === 'failed') { fetchData(); }
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [params.id]);

  if (!campaign) {
    return <div className="p-12 text-center text-[#8D909C] font-mono animate-pulse mt-12">Loading campaign #{params.id}...</div>;
  }

  const total = campaign.total || 0;
  const sent = campaign.sent_count || 0;
  const failed = campaign.failed_count || 0;
  const processed = sent + failed;
  const pending = total > 0 ? (total - processed) : 0;
  const successRate = processed > 0 ? Math.round((sent / processed) * 100) : 0;
  const isRunning = campaign.status === 'running';
  const totalOpened = logs.filter(log => log.opened === 1).length;
  const notOpened = sent > 0 ? sent - totalOpened : 0;

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <Link href="/campaigns" className="text-[#1297FD] text-sm font-mono mb-4 inline-flex items-center gap-2 hover:underline transition-all">
          <ArrowLeft size={16} /> Back to Campaigns
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-[#0C0D10] flex flex-wrap items-center gap-3">
              {campaign.name}
              {campaign.status === 'running' && (
                <span className="text-[10px] bg-[rgba(18,151,253,.1)] text-[#1297FD] px-2.5 py-1.5 rounded-full border border-[rgba(18,151,253,.2)] flex items-center gap-1.5 font-mono">
                  <div className="w-1.5 h-1.5 bg-[#1297FD] rounded-full animate-ping" /> RUNNING
                </span>
              )}
              {campaign.status === 'paused' && (
                <span className="text-[10px] bg-[rgba(245,158,11,.1)] text-[#B45309] px-2.5 py-1.5 rounded-full border border-[rgba(245,158,11,.2)] flex items-center gap-1.5 font-mono">
                  PAUSED
                </span>
              )}
            </h1>
            <p className="text-[#8D909C] mt-1 font-mono text-sm">ID: #{campaign.id} · {total} recipients</p>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === 'running' && (
              <button 
                onClick={() => handleAction('pause')}
                className="px-4 py-2 bg-white border border-[#E8E9EC] rounded-xl text-xs font-bold text-[#F59E0B] hover:bg-[#F2F3F5] transition-all flex items-center gap-2 shadow-sm"
              >
                PAUSE
              </button>
            )}
            {campaign.status === 'paused' && (
              <button 
                onClick={() => handleAction('resume')}
                className="px-4 py-2 bg-[#1297FD] rounded-xl text-xs font-bold text-white hover:bg-[#0085E6] transition-all flex items-center gap-2 shadow-sm"
              >
                RESUME
              </button>
            )}
            {(campaign.status === 'running' || campaign.status === 'paused') && (
              <button 
                onClick={() => handleAction('cancel')}
                className="px-4 py-2 bg-white border border-[#E8E9EC] rounded-xl text-xs font-bold text-[#EF4444] hover:bg-[rgba(239,68,68,0.05)] transition-all flex items-center gap-2 shadow-sm"
              >
                CANCEL
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {[
            { label: 'Dispatched', value: sent, color: '#22C55E', border: 'border-t-[#22C55E]' },
            { label: 'Failed', value: failed, color: '#EF4444', border: 'border-t-[#EF4444]' },
            { label: 'Pending', value: pending, color: '#F59E0B', border: 'border-t-[#F59E0B]' },
            { label: 'Delivery Rate', value: `${successRate}%`, color: '#1297FD', border: 'border-t-[#1297FD]' },
            { label: 'Verified Opens', value: totalOpened, color: '#1297FD', border: 'border-t-[#40AAF8]' },
            { label: 'Unopened', value: notOpened, color: '#8D909C', border: 'border-t-[#8D909C]' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
              className={`bg-white border border-[#E8E9EC] ${stat.border} border-t-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="text-[10px] font-bold font-mono text-[#8D909C] mb-2 uppercase tracking-wider">{stat.label}</div>
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Campaign Intelligence Side-Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-[#E8E9EC] border-l-2 border-l-[#1297FD] rounded-2xl p-6 shadow-sm space-y-5 h-fit">
          <h3 className="font-mono text-[#1297FD] flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Target size={16} /> Campaign Intelligence
          </h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-[#8D909C] font-mono uppercase block mb-1">Status</span>
              <div className="flex">
                {campaign.status === 'running' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(18,151,253,.1)] text-[#1297FD] text-[10px] font-mono border border-[rgba(18,151,253,0.2)]"><div className="w-1 h-1 bg-[#1297FD] rounded-full animate-pulse" /> RUNNING</span>}
                {campaign.status === 'paused' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,.1)] text-[#B45309] text-[10px] font-mono border border-[rgba(245,158,11,0.2)]">PAUSED</span>}
                {campaign.status === 'completed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(34,197,94,.1)] text-[#15803D] text-[10px] font-mono border border-[rgba(34,197,94,0.2)]">COMPLETED</span>}
                {campaign.status === 'cancelled' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(239,68,68,.1)] text-[#DC2626] text-[10px] font-mono border border-[rgba(239,68,68,0.2)]">CANCELLED</span>}
                {campaign.status === 'scheduled' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(141,144,156,.1)] text-[#8D909C] text-[10px] font-mono border border-[rgba(141,144,156,0.2)]">SCHEDULED</span>}
                {campaign.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(141,144,156,.1)] text-[#8D909C] text-[10px] font-mono border border-[rgba(141,144,156,0.2)]">PENDING</span>}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#8D909C] font-mono uppercase block mb-1">Via Account</span>
              <p className="text-xs font-mono text-[#1297FD] break-all">{campaign.account_emails || 'Loading...'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[#F2F3F5] pt-4">
              <div>
                <span className="text-[10px] text-[#8D909C] font-mono uppercase block mb-1">Start Time</span>
                <p className="text-[11px] font-medium text-[#474A56] leading-relaxed">
                  {campaign.started_at ? new Date(campaign.started_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#8D909C] font-mono uppercase block mb-1">End Time</span>
                <p className="text-[11px] font-medium text-[#474A56] leading-relaxed">
                  {campaign.finished_at ? new Date(campaign.finished_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            </div>

            {campaign.started_at && campaign.finished_at && (
              <div className="bg-[#F2F3F5] p-3 rounded-xl border border-[#E8E9EC]">
                <span className="text-[9px] text-[#8D909C] font-mono uppercase block mb-1">Execution Time</span>
                <p className="text-xs font-bold text-[#1297FD]">
                  {(() => {
                    const start = new Date(campaign.started_at + 'Z').getTime();
                    const end = new Date(campaign.finished_at + 'Z').getTime();
                    const diff = Math.floor((end - start) / 1000);
                    if (diff < 60) return `${diff}s`;
                    const min = Math.floor(diff / 60);
                    const sec = diff % 60;
                    return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm">
        <h3 className="font-mono text-[#1297FD] flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider">
          <Mail size={16} /> Dispatch Log
        </h3>
        <div className="overflow-x-auto rounded-xl border border-[#E8E9EC]">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-[#F2F3F5] border-b border-[#E8E9EC] text-[10px] font-mono text-[#8D909C] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-normal">Timestamp</th>
                <th className="px-5 py-3 font-normal">Recipient</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Engagement</th>
                <th className="px-5 py-3 font-normal">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E9EC]">
              {logs.filter((l: any) => l.status !== 'queued').map((log: any) => (
                <tr key={log.id} className="text-sm hover:bg-[rgba(18,151,253,.025)] transition-colors">
                  <td className="px-5 py-4 text-[#8D909C] text-xs whitespace-nowrap font-mono">{new Date(log.sent_at + 'Z').toLocaleString()}</td>
                  <td className="px-5 py-4 font-mono text-[#474A56] font-medium">{log.recipient}</td>
                  <td className="px-5 py-4">
                    {log.status === 'sent' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(34,197,94,.1)] text-[#15803D] text-[10px] font-mono border border-[rgba(34,197,94,.18)]"><CheckCircle size={10} /> SENT</span>}
                    {log.status === 'failed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(239,68,68,.08)] text-[#DC2626] text-[10px] font-mono border border-[rgba(239,68,68,.15)]"><XCircle size={10} /> FAILED</span>}
                    {(log.status === 'processing' || log.status === 'retrying') && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(18,151,253,.1)] text-[#1297FD] text-[10px] font-mono border border-[rgba(18,151,253,.18)]"><Clock size={10} /> {log.status.toUpperCase()}</span>}
                  </td>
                  <td className="px-5 py-4">
                    {log.opened === 1 ? (
                      <span className="text-[#1297FD] font-bold flex items-center gap-2 text-xs"><CheckCircle2 size={14} /> OPENED ({log.open_count}x)</span>
                    ) : (
                      <span className="text-[#8D909C] text-xs flex items-center gap-1"><EyeOff size={12} /> Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-[#8D909C] max-w-[300px] truncate">
                    {log.error_msg || "250 OK"}
                  </td>
                </tr>
              ))}
              {logs.filter((l: any) => l.status !== 'queued').length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-[#8D909C] font-mono text-sm">Emails are ready to send. Logs will appear here as they dispatch.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
