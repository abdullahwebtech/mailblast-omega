'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Calendar, Target, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import CampaignEditor from '@/components/CampaignEditor';
import { useModals } from '@/context/ModalContext';
import Pagination from '@/components/ui/Pagination';

export default function SchedulerPage() {
  const { showConfirm } = useModals();
  const [view, setView] = useState<'list' | 'add'>('list');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  const fetchJobs = (p = page) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/scheduler/list?page=${p}&limit=${pageSize}`).then(res => res.json()).then(data => { 
      setJobs(data.jobs || []); 
      setTotal(data.total || 0);
      setLoading(false); 
    }).catch(e => { console.error(e); setLoading(false); });
  };

  useEffect(() => { 
    fetchJobs(page); 
    const interval = setInterval(() => { if (!document.hidden) fetchJobs(page); }, 15000); 
    return () => clearInterval(interval); 
  }, [page]);

  const cancelJob = async (jobId: number) => {
    const confirmed = await showConfirm('Cancel Dispatch', "Are you sure you want to cancel this scheduled dispatch? This action cannot be undone.");
    if (!confirmed) return;
    try { const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/scheduler/jobs/${jobId}`, { method: 'DELETE' }); if (res.ok) fetchJobs(page); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0C0D10]">Scheduler</h1>
          <p className="text-[#8D909C] mt-1 text-sm">Precision-timed dispatch control for campaigns and single hits.</p>
        </div>
        {view === 'list' && (
          <button onClick={() => setView('add')}
            className="bg-[#1297FD] text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0A82E0] transition-colors shadow-sm w-full sm:w-auto justify-center">
            <Plus size={18} /> Add Schedule
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm">
            <h3 className="font-mono text-[#1297FD] flex items-center gap-2 mb-6 uppercase tracking-wider text-xs font-bold">
              <Clock size={16} /> Active Scheduled Jobs
            </h3>
            {loading ? (
              <div className="p-12 text-center text-[#8D909C] font-mono animate-pulse text-xs">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-[#D8DADF] rounded-2xl flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F2F3F5] flex items-center justify-center text-[#D8DADF]"><Calendar size={32} /></div>
                <div className="space-y-1">
                  <p className="font-semibold text-[#474A56]">No pending dispatches.</p>
                  <p className="text-sm text-[#8D909C]">Schedule your first blast to see it here.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="border-b border-[#E8E9EC] text-[10px] font-mono text-[#8D909C] uppercase tracking-wider">
                    <tr>
                      <th className="pb-4 font-normal pl-4">Campaign</th>
                      <th className="pb-4 font-normal">Type</th>
                      <th className="pb-4 font-normal">Scheduled Time</th>
                      <th className="pb-4 font-normal text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E9EC]">
                    {jobs.map((job) => (
                      <tr key={job.id} className="text-sm group hover:bg-[rgba(18,151,253,.025)] transition-colors">
                        <td className="py-5 pl-4">
                          <div className="font-semibold text-[#0C0D10] mb-0.5">{job.campaign_name}</div>
                          <div className="text-[10px] text-[#8D909C] font-mono uppercase">ID: #{job.campaign_id}</div>
                        </td>
                        <td className="py-5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${job.campaign_type === 'single' ? 'bg-[rgba(168,85,247,.08)] text-[#7C3AED] border-[rgba(168,85,247,.2)]' : 'bg-[rgba(18,151,253,.1)] text-[#1297FD] border-[rgba(18,151,253,.2)]'}`}>
                            {job.campaign_type === 'single' ? <User size={10} /> : <Target size={10} />}
                            {job.campaign_type}
                          </span>
                        </td>
                        <td className="py-5">
                          <div className="flex items-center gap-2 text-[#F59E0B] font-mono text-xs">
                            <Clock size={12} />{new Date(job.scheduled_at + 'Z').toLocaleString()}
                          </div>
                        </td>
                        <td className="py-5 text-right pr-4">
                          <button onClick={() => cancelJob(job.id)} className="p-2 text-[#8D909C] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,.06)] rounded-lg transition-all" title="Cancel">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {jobs.length > 0 && (
              <div className="mt-6 border-t border-[#E8E9EC] pt-4">
                <Pagination
                  totalItems={total}
                  pageSize={pageSize}
                  currentPage={page}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="add" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setView('list')} className="text-[#8D909C] hover:text-[#0C0D10] transition-colors flex items-center gap-1 text-sm font-medium">← Back</button>
              <div className="h-4 w-px bg-[#E8E9EC]"></div>
              <span className="text-xs font-mono text-[#1297FD] uppercase tracking-wider font-bold">New Scheduled Dispatch</span>
            </div>
            <CampaignEditor mode="scheduled" onSuccess={() => { fetchJobs(); setView('list'); }} onCancel={() => setView('list')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
