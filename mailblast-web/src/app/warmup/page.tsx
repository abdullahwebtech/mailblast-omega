'use client';

import { motion } from 'framer-motion';
import { Flame, ShieldCheck, Activity, Power } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WarmUp() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState({ network_pool: 0, avg_deliverability: 0, interactions_today: 0 });
  const [warmupStatus, setWarmupStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts`).then(r => r.json()).then(d => setAccounts(d.accounts || []));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/warmup/status`).then(r => r.json()).then(d => {
      const s: Record<number, boolean> = {};
      (d.active_ids || []).forEach((id: number) => s[id] = true);
      setWarmupStatus(s);
    });
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/warmup/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const toggleWarmup = async (id: number) => {
    const enabling = !warmupStatus[id];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/warmup/toggle/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: enabling }) });
      if (res.ok) setWarmupStatus(prev => ({ ...prev, [id]: enabling }));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8 max-w-[1200px] pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#0C0D10]">Inbox Warm-Up</h1>
        <p className="text-[#8D909C] mt-1 text-sm">Automated P2P interaction network to build domain reputation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Activity className="text-[#1297FD]" size={20} />, label: 'Network Pool', value: stats.network_pool.toLocaleString(), sub: 'Active inboxes', valCls: 'text-[#0C0D10]' },
          { icon: <ShieldCheck className="text-[#22C55E]" size={20} />, label: 'Avg Deliverability', value: stats.avg_deliverability > 0 ? `${stats.avg_deliverability}%` : '—', sub: 'Past 30d', valCls: 'text-[#22C55E]' },
          { icon: <Flame className="text-[#F59E0B]" size={20} />, label: 'Interactions Today', value: stats.interactions_today.toLocaleString(), sub: 'P2P exchanges', valCls: 'text-[#F59E0B]' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">{s.icon}<h3 className="font-semibold text-xs uppercase tracking-wider font-mono text-[#8D909C]">{s.label}</h3></div>
            <div className={`text-3xl font-bold ${s.valCls}`}>{s.value}</div>
            <p className="text-[#8D909C] text-[10px] mt-2 font-mono uppercase">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-bold font-mono text-[#8D909C] uppercase tracking-wider mb-4">Account Warm-Up Control</h3>
        <div className="bg-white border border-[#E8E9EC] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#F2F3F5] border-b border-[#E8E9EC]">
              <tr>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Account</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Reputation</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Daily Limit</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Status</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E9EC]">
              {accounts.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-[#8D909C] text-sm">No accounts found.</td></tr>
              ) : accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-[rgba(18,151,253,.025)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#0C0D10]">{acc.email}</div>
                    <div className="text-[10px] text-[#8D909C] font-mono uppercase">{acc.provider}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-[#F2F3F5] rounded-full border border-[#E8E9EC] overflow-hidden">
                        <div className={`h-full rounded-full ${acc.reputation_score > 70 ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} style={{ width: `${acc.reputation_score || 0}%` }} />
                      </div>
                      <span className={`text-[10px] font-mono font-semibold ${acc.reputation_score > 70 ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>{acc.reputation_score || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#474A56] font-mono text-xs">{acc.daily_limit > 0 ? `${acc.daily_limit} msg/day` : 'Unlimited'}</td>
                  <td className="px-6 py-4">
                    {warmupStatus[acc.id] ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(34,197,94,.1)] text-[#15803D] text-[10px] font-mono border border-[rgba(34,197,94,.18)]"><Flame size={11} /> WARMING</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(141,144,156,.1)] text-[#8D909C] text-[10px] font-mono border border-[rgba(141,144,156,.18)]"><Power size={11} /> PAUSED</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => toggleWarmup(acc.id)}
                      className={`px-4 py-2 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-colors ${warmupStatus[acc.id] ? 'border-[rgba(239,68,68,.3)] text-[#EF4444] hover:bg-[rgba(239,68,68,.06)]' : 'border-[rgba(18,151,253,.3)] text-[#1297FD] hover:bg-[rgba(18,151,253,.07)]'}`}>
                      {warmupStatus[acc.id] ? 'Stop' : 'Start'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
