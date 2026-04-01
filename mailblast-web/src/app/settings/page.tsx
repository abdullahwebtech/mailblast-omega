'use client';

import { motion } from 'framer-motion';
import { Database, Zap, Key } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Settings() {
  const [groqKey, setGroqKey] = useState('');
  const [seedList, setSeedList] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [seedSaveStatus, setSeedSaveStatus] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings/get_groq`).then(r => r.json()).then(d => setGroqKey(d.key || '')).catch(() => {});
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings/get_seeds`).then(r => r.json()).then(d => setSeedList(d.seeds || '')).catch(() => {});
  }, []);

  const handleSaveGroq = async () => {
    setSaveStatus('Saving...');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings/update_groq`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: groqKey }) });
      setSaveStatus(res.ok ? 'Saved!' : 'Failed.'); setTimeout(() => setSaveStatus(''), 2000);
    } catch { setSaveStatus('Network error.'); }
  };

  const handleSaveSeeds = async () => {
    setSeedSaveStatus('Saving...');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings/update_seeds`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seeds: seedList }) });
      setSeedSaveStatus(res.ok ? 'Saved!' : 'Failed.'); setTimeout(() => setSeedSaveStatus(''), 2000);
    } catch { setSeedSaveStatus('Network error.'); }
  };

  const inputCls = "bg-white border border-[#D8DADF] rounded-lg px-4 py-2.5 text-sm text-[#0C0D10] focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)] transition-colors placeholder:text-[#8D909C]";

  const Section = ({ icon, title, children, delay = 0 }: any) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E8E9EC]">
        {icon}
        <h2 className="text-base font-bold text-[#0C0D10]">{title}</h2>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold text-[#0C0D10]">Settings</h1>
        <p className="text-[#8D909C] mt-1 text-sm">Configure backend mechanics and integrations.</p>
      </div>

      <Section icon={<Key className="text-[#1297FD]" size={20} />} title="AI Studio — Groq API Key">
        <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-5">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0C0D10] mb-1">Groq Llama 3 API Key</p>
            <p className="text-xs text-[#8D909C]">
              Required for AI Studio. Get your free key at{' '}
              <a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="text-[#1297FD] hover:underline">console.groq.com</a>.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)}
              placeholder="gsk_YOUR_API_KEY_HERE" className={`${inputCls} w-full lg:w-[280px]`} />
            <button onClick={handleSaveGroq} className="px-5 py-2.5 bg-[#1297FD] text-white hover:bg-[#0A82E0] text-sm font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap">
              Save Key
            </button>
          </div>
        </div>
        {saveStatus && <p className={`text-xs font-mono mt-3 text-right ${saveStatus.includes('Saved') ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{saveStatus}</p>}
      </Section>

      <Section icon={<Zap className="text-[#F59E0B]" size={20} />} title="Warm-Up Seed List" delay={0.05}>
        <p className="text-sm font-medium text-[#0C0D10] mb-1">Seed Addresses</p>
        <p className="text-xs text-[#8D909C] mb-4">These addresses receive automated warm-up emails. Use your own secondary inboxes.</p>
        <textarea value={seedList} onChange={e => setSeedList(e.target.value)}
          placeholder={"email1@example.com\nemail2@example.com"}
          className={`${inputCls} w-full h-[140px] resize-none font-mono`} />
        <div className="flex justify-between items-center mt-4">
          <span className={`text-xs font-mono ${seedSaveStatus.includes('Saved') ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{seedSaveStatus}</span>
          <button onClick={handleSaveSeeds} className="px-5 py-2.5 bg-[#F59E0B] text-white hover:bg-[#D97706] text-sm font-semibold rounded-lg transition-colors shadow-sm">
            Save Seed List
          </button>
        </div>
      </Section>

      <Section icon={<Database className="text-[#1297FD]" size={20} />} title="Database" delay={0.1}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-[#0C0D10] mb-1">SQLite Database Path</p>
            <p className="text-xs text-[#8D909C]">Local path to the omega.db file</p>
          </div>
          <input type="text" value="database/omega.db" disabled className={`${inputCls} w-full sm:w-[280px] bg-[#F2F3F5] text-[#8D909C] cursor-not-allowed`} />
        </div>
      </Section>
    </div>
  );
}
