'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

const RANGES = [
  { id: 'today', label: 'Last 24h', sub: 'Rolling' },
  { id: '7d', label: '7 Days', sub: 'Weekly' },
  { id: '30d', label: '30 Days', sub: 'Monthly' },
  { id: '1y', label: '1 Year', sub: 'Annual' },
  { id: 'forever', label: 'Forever', sub: 'Lifetime' },
];

export default function Analytics() {
  const [range, setRange] = useState('7d');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [stats, setStats] = useState({ total_sent: 0, total_failed: 0, total_opened: 0, open_rate: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch accounts once
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts?limit=1000`).then(r => r.json()).then(d => setAccounts(d.accounts || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const accQuery = selectedAccountId !== 'all' ? `&account_id=${selectedAccountId}` : '';
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/stats?range=${range}${accQuery}`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/open-rate-history?range=${range}${accQuery}`).then(r => r.json()),
    ]).then(([statsData, historyData]) => {
      setStats(statsData);
      setHistory(historyData.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [range, selectedAccountId]);

  const successRate = stats.total_sent > 0 ? (((stats.total_sent - stats.total_failed) / stats.total_sent) * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-8 max-w-[1600px] pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E8E9EC] pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[#0C0D10]">
            <BarChart3 className="text-[#1297FD]" /> Analytics
          </h1>
          <p className="text-[#8D909C] mt-1 font-mono text-sm uppercase tracking-wider">Performance & Historical Trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E9EC] rounded-xl shadow-sm">
            <span className="text-[10px] font-bold font-mono text-[#8D909C] uppercase tracking-tighter">Account:</span>
            <select 
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-[#40AAF8] outline-none cursor-pointer focus:ring-0 min-w-[140px]"
            >
              <option value="all">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.email}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-[#F2F3F5] p-1 rounded-xl border border-[#E8E9EC]">
            {RANGES.map(r => (
              <button key={r.id} onClick={() => setRange(r.id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center min-w-[80px] ${range === r.id ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>
                <span>{r.label}</span>
                <span className="text-[8px] opacity-70 -mt-0.5">{r.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="TOTAL DISPATCHED" value={stats.total_sent.toLocaleString()} color="#1297FD" description={`Delivery Success: ${successRate}%`} />
        <StatCard title="UNIQUE OPENS" value={stats.total_opened.toLocaleString()} color="#22C55E" description={`Avg Open Rate: ${stats.open_rate}%`} />
        <StatCard title="BOUNCES / FAILED" value={stats.total_failed.toLocaleString()} color="#EF4444" description="Requires network audit" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E8E9EC] rounded-2xl p-8 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-8 border-b border-[#E8E9EC] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0C0D10]">Historical Performance</h3>
            <p className="text-xs text-[#8D909C] font-mono mt-1">Dispatch Volume vs Audience Engagement</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#1297FD]">
              <div className="w-2 h-2 rounded-full bg-[#1297FD]" /> DISPATCHES
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#22C55E]">
              <div className="w-2 h-2 rounded-full bg-[#22C55E]" /> OPENS
            </div>
          </div>
        </div>
        <div className="w-full h-[450px]" style={{ minHeight: '450px' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center font-mono text-[#8D909C] animate-pulse">Loading data...</div>
          ) : history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8D909C] font-mono space-y-4">
              <Clock size={40} className="text-[#D8DADF]" />
              <p>No historical data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={history} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1297FD" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1297FD" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E9EC" vertical={false} />
                <XAxis dataKey="label" stroke="#E8E9EC" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#8D909C' }} />
                <YAxis stroke="#E8E9EC" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#8D909C' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E9EC', borderRadius: '12px', fontFamily: 'monospace', color: '#0C0D10', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }} itemStyle={{ fontSize: '12px' }} cursor={{ fill: 'rgba(18,151,253,.03)' }} />
                <Bar dataKey="sent" fill="url(#colorSent)" name="Sent" radius={[4, 4, 0, 0]} barSize={range === 'today' ? 10 : 30} />
                <Bar dataKey="opens" fill="url(#colorOpens)" name="Opened" radius={[4, 4, 0, 0]} barSize={range === 'today' ? 10 : 30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
