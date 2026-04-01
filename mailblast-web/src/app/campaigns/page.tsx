'use client';

import { motion } from 'framer-motion';
import { Layers, Activity, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useModals } from '@/context/ModalContext';

interface CampaignType {
  id: number; name: string; status: string; total: number;
  sent_count: number; failed_count: number; started_at: string; finished_at: string; account_emails?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CampaignType | null>(null);
  const pageSize = 15;

  const fetchCampaigns = (p = page) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/campaigns?page=${p}&limit=${pageSize}`).then(res => res.json()).then(data => { 
      setCampaigns(data.campaigns || []); 
      setTotal(data.total || 0);
      setLoading(false); 
    }).catch(e => { console.error(e); setLoading(false); });
  };

  const handleAction = async (e: React.MouseEvent, id: number, action: string) => {
    e.stopPropagation();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/campaign/${id}/${action}`, { method: 'POST' });
      fetchCampaigns(page);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/campaigns/${itemToDelete.id}`, { method: 'DELETE' });
      fetchCampaigns(page);
    } catch (err) { console.error(err); }
  };

  const { showConfirm } = useModals();

  const handleDeleteAll = async () => {
    if (campaigns.length === 0) return;
    const confirmed = await showConfirm('Delete All Campaigns', 'Are you sure you want to soft-delete ALL campaigns? They will be moved to the Trash.');
    if (!confirmed) return;
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/campaigns/delete-all`, { method: 'POST' });
    setLoading(false);
    fetchCampaigns(1);
  };

  useEffect(() => { 
    fetchCampaigns(page); 
    const interval = setInterval(() => fetchCampaigns(page), 3000); 
    return () => clearInterval(interval); 
  }, [page]);

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0C0D10]">All Campaigns</h1>
          <p className="text-[#8D909C] mt-1 text-sm">Live overview of every active and completed blast.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {campaigns.length > 0 && (
            <button onClick={handleDeleteAll} disabled={loading}
              className="px-4 py-2.5 bg-[rgba(239,68,68,.08)] text-[#EF4444] font-semibold rounded-lg text-sm border border-[rgba(239,68,68,.2)] hover:bg-[rgba(239,68,68,.14)] transition-colors flex items-center gap-2 disabled:opacity-50">
              <Trash2 size={16} /> Delete All
            </button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm">
        <h3 className="font-mono text-[#1297FD] flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider">
          <Layers size={18} /> Campaign Ledger
        </h3>
        {loading ? (
          <div className="p-12 text-center text-[#8D909C] font-mono animate-pulse text-sm">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[#D8DADF] rounded-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F2F3F5] flex items-center justify-center text-[#D8DADF]"><Layers size={32} /></div>
            <p className="font-semibold text-[#474A56]">No campaigns yet.</p>
            <p className="text-sm text-[#8D909C]">Head to Composer to start your first sequence.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="border-b border-[#E8E9EC] text-[10px] font-mono text-[#8D909C] uppercase tracking-wider">
                  <tr>
                    <th className="pb-4 font-normal">ID / Name</th>
                    <th className="pb-4 font-normal">Status</th>
                    <th className="pb-4 font-normal">Total</th>
                    <th className="pb-4 font-normal">Sent</th>
                    <th className="pb-4 font-normal">Failed</th>
                    <th className="pb-4 font-normal">Pending</th>
                    <th className="pb-4 font-normal">Progress</th>
                    <th className="pb-4 font-normal text-right">Started</th>
                    <th className="pb-4 font-normal text-right pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E9EC]">
                  {campaigns.map((camp) => {
                    const total = camp.total || 0;
                    const sent = camp.sent_count || 0;
                    const failed = camp.failed_count || 0;
                    const processed = sent + failed;
                    const pending = total > 0 ? (total - processed) : 0;
                    const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
                    const isRunning = camp.status === 'running';
                    const isPaused = camp.status === 'paused';
                    const isCompleted = camp.status === 'completed';
                    const isScheduled = camp.status === 'scheduled';
                    return (
                      <tr key={camp.id} onClick={() => router.push(`/campaigns/${camp.id}`)}
                        className="text-sm group hover:bg-[rgba(18,151,253,.025)] transition-colors cursor-pointer">
                        <td className="py-4 pl-3">
                          <div className="font-semibold text-[#0C0D10] group-hover:text-[#1297FD] transition-colors">#{camp.id}</div>
                          <div className="text-xs text-[#8D909C] max-w-[200px] truncate">{camp.name}</div>
                          {camp.account_emails && <div className="text-[10px] text-[#1297FD] truncate max-w-[200px] mt-0.5">Via: {camp.account_emails}</div>}
                        </td>
                        <td className="py-4">
                          {isRunning && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(18,151,253,.1)] text-[#1297FD] text-[10px] font-mono border border-[rgba(18,151,253,.2)]"><Activity size={10} /> RUNNING</span>}
                          {isPaused && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,.08)] text-[#B45309] text-[10px] font-mono border border-[rgba(245,158,11,.18)]"><Clock size={10} /> PAUSED</span>}
                          {isCompleted && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(34,197,94,.1)] text-[#15803D] text-[10px] font-mono border border-[rgba(34,197,94,.18)]"><CheckCircle size={10} /> DONE</span>}
                          {isScheduled && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,.08)] text-[#B45309] text-[10px] font-mono border border-[rgba(245,158,11,.18)]"><Clock size={10} /> SCHEDULED</span>}
                          {!isRunning && !isPaused && !isCompleted && !isScheduled && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(141,144,156,.1)] text-[#8D909C] text-[10px] font-mono border border-[rgba(141,144,156,.18)]"><Clock size={10} /> {camp.status.toUpperCase()}</span>}
                        </td>
                        <td className="py-4 font-mono text-[#474A56]">{total}</td>
                        <td className="py-4 font-mono text-[#22C55E]">{sent}</td>
                        <td className="py-4 font-mono text-[#EF4444]">{failed}</td>
                        <td className="py-4 font-mono text-[#F59E0B]">{pending}</td>
                        <td className="py-4 min-w-[150px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-[#F2F3F5] rounded-full overflow-hidden border border-[#E8E9EC]">
                              <div className={`h-full rounded-full ${isCompleted ? 'bg-[#22C55E]' : 'bg-[#1297FD]'}`} style={{ width: `${percent}%` }} />
                            </div>
                            <span className="text-xs font-mono w-8 text-right text-[#8D909C]">{percent}%</span>
                          </div>
                          {total > 0 && <div className="text-[10px] text-[#8D909C] mt-1">{processed} / {total}</div>}
                        </td>
                        <td className="py-4 text-right text-xs text-[#8D909C] whitespace-nowrap">{camp.started_at ? new Date(camp.started_at + 'Z').toLocaleString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true, month:'short', day:'numeric'}) : 'N/A'}</td>
                        <td className="py-4 text-right pr-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {isRunning && (
                              <button onClick={(e) => handleAction(e, camp.id, 'pause')} className="p-1.5 hover:bg-[#F2F3F5] rounded-md text-[#F59E0B] transition-colors" title="Pause"><Clock size={14} /></button>
                            )}
                            {isPaused && (
                              <button onClick={(e) => handleAction(e, camp.id, 'resume')} className="p-1.5 hover:bg-[#F2F3F5] rounded-md text-[#1297FD] transition-colors" title="Resume"><Activity size={14} /></button>
                            )}
                            {(isRunning || isPaused) && (
                              <button onClick={(e) => handleAction(e, camp.id, 'cancel')} className="p-1.5 hover:bg-[#F2F3F5] rounded-md text-[#EF4444] transition-colors" title="Cancel"><XCircle size={14} /></button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setItemToDelete(camp); setDeleteModalOpen(true); }} 
                              className="p-1.5 hover:bg-[rgba(239,68,68,.08)] rounded-md text-[#EF4444] transition-colors" 
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E9EC]">
              <Pagination
                totalItems={total}
                pageSize={pageSize}
                currentPage={page}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </motion.div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDelete}
        itemName={itemToDelete ? `Campaign #${itemToDelete.id}` : 'this campaign'}
      />
    </div>
  );
}
