'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Globe, BarChart3, Clock } from 'lucide-react';

const RANGES = [
  { id: 'today', label: 'Last 24h', sub: 'Rolling Window' },
  { id: '7d', label: '7 Days', sub: 'Weekly Trend' },
  { id: '30d', label: '30 Days', sub: 'Monthly' },
  { id: '1y', label: '1 Year', sub: 'Annual' },
  { id: 'forever', label: 'Forever', sub: 'Lifetime' },
];

export default function Dashboard() {
  const [range, setRange] = useState('7d');
  const [stats, setStats] = useState<any>({ total_sent: 0, open_rate: 0, total_failed: 0, lifetime_total: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchStats = fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/stats?range=${range}`).then(r => r.json());
    const fetchHistory = fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/open-rate-history?range=${range}`).then(r => r.json());
    const fetchRecent = fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/recent-campaigns`).then(r => r.json());
    Promise.all([fetchStats, fetchHistory, fetchRecent]).then(([statsData, historyData, recentData]) => {
      setStats(statsData);
      setHistory(historyData.data || []);
      setRecentCampaigns(recentData.campaigns || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [range]);

  const chartData = useMemo(() => history.map(item => ({ name: item.label.split('T')[0], sent: item.sent })), [history]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between bg-white p-4 lg:p-6 rounded-2xl border border-[#E8E9EC] shadow-sm">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-3 text-[#0C0D10]">
            <BarChart3 className="text-[#1297FD]" size={24} /> Dashboard
          </h1>
          <p className="text-[#8D909C] mt-1 text-sm font-mono">
            {range === 'today' ? 'Rolling 24h window' : `Analytics: ${range.toUpperCase()}`}
          </p>
        </div>
        <div className="flex bg-[#F2F3F5] p-1 rounded-xl border border-[#E8E9EC] overflow-x-auto no-scrollbar">
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`px-3 lg:px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center min-w-[65px] lg:min-w-[80px] flex-shrink-0 ${range === r.id ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>
              <span>{r.label}</span>
              <span className="text-[8px] opacity-70 -mt-0.5">{r.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="LIFETIME TOTAL" value={stats.lifetime_total?.toLocaleString() || "0"} color="#A855F7" description="Total Dispatches" />
        <StatCard title={range === 'today' ? "LAST 24H SENDS" : "PERIOD SENDS"} value={stats.total_sent?.toLocaleString() || "0"} color="#1297FD" description={`Volume: ${range}`} />
        <StatCard title="OPEN RATE" value={`${stats.open_rate}%`} color="#22C55E" description="Interaction Rate" />
        <StatCard title="FAILED / BOUNCED" value={stats.total_failed?.toLocaleString() || "0"} color="#EF4444" description="Delivery Failures" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6 lg:gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-[#E8E9EC] rounded-2xl p-8 relative overflow-hidden flex flex-col min-h-[500px] shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Globe size={200} /></div>
          <div className="flex items-center justify-between mb-8 z-10">
            <div>
              <h2 className="text-lg font-bold text-[#0C0D10]">Dispatch Volume</h2>
              <p className="text-xs text-[#8D909C] font-mono mt-1">Sent emails over selected window</p>
            </div>
            <div className={`text-[10px] font-mono px-3 py-1 rounded-full border flex items-center gap-2 ${loading ? 'border-[#F59E0B]/30 text-[#F59E0B] bg-[rgba(245,158,11,.06)]' : 'border-[rgba(18,151,253,.2)] text-[#1297FD] bg-[rgba(18,151,253,.06)]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-[#F59E0B] animate-pulse' : 'bg-[#1297FD]'}`} />
              {loading ? 'LOADING...' : 'LIVE DATA'}
            </div>
          </div>
          <div className="flex-1 min-h-[350px]">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#8D909C] font-mono space-y-4">
                <Clock size={40} className="text-[#D8DADF]" />
                <p className="text-sm">No data for this range</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1297FD" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1297FD" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="#E8E9EC" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#8D909C' }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E9EC" vertical={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E9EC', borderRadius: '12px', fontFamily: 'monospace', color: '#0C0D10', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }} itemStyle={{ color: '#1297FD', fontSize: '12px' }} labelStyle={{ color: '#8D909C', fontSize: '10px', marginBottom: '4px' }} cursor={{ fill: 'rgba(18,151,253,.03)' }} />
                  <Bar dataKey="sent" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={range === 'today' ? 12 : 24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <div className="space-y-6 flex flex-col h-full">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-[#E8E9EC] rounded-2xl p-6 flex-1 shadow-sm">
            <h3 className="font-mono text-xs font-bold text-[#0C0D10] mb-6 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2"><Zap size={14} className="text-[#F59E0B]" /><span>Recent Activity</span></div>
              <Link href="/campaigns" className="text-[10px] text-[#1297FD] hover:underline transition-colors uppercase tracking-wider font-bold">View All →</Link>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead className="text-[#8D909C] text-[10px] font-bold uppercase border-b border-[#E8E9EC]">
                  <tr>
                    <th className="pb-3 px-2 text-left w-1/2">Campaign</th>
                    <th className="pb-3 px-2 text-left">Sends</th>
                    <th className="pb-3 text-right">Opens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E9EC]">
                  {recentCampaigns.map(c => (
                    <tr key={c.id} className="group hover:bg-[rgba(18,151,253,.025)] transition-colors cursor-pointer" onClick={() => window.location.href = `/campaigns/${c.id}`}>
                      <td className="py-4 px-2 align-top">
                        <div className="font-semibold text-[#0C0D10] group-hover:text-[#1297FD] transition-colors truncate" title={c.name}>{c.name}</div>
                        <div className="text-[10px] text-[#8D909C] font-mono uppercase tracking-wider">{c.status}</div>
                      </td>
                      <td className="py-4 px-2 font-mono text-[#1297FD]/80 align-top whitespace-nowrap">{c.sent} <span className="text-[10px] opacity-50 uppercase">msg</span></td>
                      <td className="py-4 px-2 text-right font-mono text-[#22C55E] align-top whitespace-nowrap tabular-nums">{c.sent > 0 ? (c.opens / c.sent * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  ))}
                  {recentCampaigns.length === 0 && (
                    <tr><td colSpan={3} className="py-12 text-center text-[#8D909C] text-sm">No campaigns yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
