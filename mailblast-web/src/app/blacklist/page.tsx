'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Trash2, Search, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Pagination from '@/components/ui/Pagination';

export default function Blacklist() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBlacklist = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/blacklist?page=${p}&limit=${pageSize}`);
      const data = await res.json();
      setBlacklist(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBlacklist(page); }, [page]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue) return;
    const val = newValue.trim().toLowerCase();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/blacklist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: val })
      });
      setNewValue('');
      loadBlacklist(page);
    } catch (err) { console.error(err); }
  };

  const handleRemove = async (email: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/blacklist/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      loadBlacklist(page);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold text-[#0C0D10] flex items-center gap-3">
          <ShieldAlert size={26} className="text-[#EF4444]" /> Blacklist
        </h1>
        <p className="text-[#8D909C] mt-1 text-sm">Emails and domains blocked from all dispatch operations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Add Panel */}
        <div className="flex-1 bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="font-semibold text-[#0C0D10] text-base mb-4">Add to Blacklist</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input value={newValue} onChange={e => setNewValue(e.target.value)} type="text"
              placeholder="person@company.com or @domain.com"
              className="w-full bg-white border border-[rgba(239,68,68,.3)] rounded-lg px-4 py-2.5 text-sm text-[#0C0D10] placeholder:text-[#8D909C] focus:outline-none focus:border-[#EF4444] focus:ring-2 focus:ring-[rgba(239,68,68,.1)] transition-colors" />
            <button type="submit"
              className="w-full bg-[rgba(239,68,68,.08)] text-[#EF4444] hover:bg-[#EF4444] hover:text-white border border-[rgba(239,68,68,.3)] transition-colors py-2.5 rounded-lg font-semibold text-sm flex justify-center items-center gap-2">
              <PlusCircle size={16} /> Block Address
            </button>
          </form>
          <div className="mt-6 p-4 bg-[rgba(245,158,11,.06)] rounded-xl border border-[rgba(245,158,11,.18)] text-sm text-[#474A56] leading-relaxed">
            <strong className="text-[#B45309]">Note:</strong> Bounced emails are automatically added to the blacklist to protect sender reputation.
          </div>
        </div>

        {/* List Panel */}
        <div className="flex-[2] bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm flex flex-col" style={{ height: '560px' }}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-[#0C0D10]">Blocked Addresses <span className="text-[#8D909C] font-normal text-sm">({total})</span></h3>
            <div className="relative w-56">
              <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search page..."
                className="w-full bg-[#F2F3F5] border border-[#E8E9EC] rounded-full pl-9 pr-4 py-2 text-sm text-[#0C0D10] placeholder:text-[#8D909C] focus:outline-none focus:border-[#1297FD] transition-colors" />
              <Search size={14} className="absolute left-3 top-2.5 text-[#8D909C]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar border border-[#E8E9EC] rounded-xl bg-[#F2F3F5]">
            {loading ? (
              <div className="p-8 text-center text-[#8D909C] text-sm animate-pulse">Loading...</div>
            ) : blacklist.length === 0 ? (
              <div className="p-8 text-center text-[#8D909C] text-sm">No entries found.</div>
            ) : (
              <ul className="divide-y divide-[#E8E9EC]">
                {blacklist.filter(b => b.email.includes(search.toLowerCase())).map((entry: any) => (
                  <li key={entry.id} className="flex justify-between items-center px-5 py-3.5 hover:bg-white transition-colors group">
                    <span className="font-mono text-sm text-[#474A56]">{entry.email}</span>
                    <button onClick={() => handleRemove(entry.email)}
                      className="p-1.5 text-[#8D909C] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,.06)] rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="mt-4">
            <Pagination
              totalItems={total}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
