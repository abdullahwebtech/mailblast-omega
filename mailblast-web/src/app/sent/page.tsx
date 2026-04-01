'use client';

import { motion } from 'framer-motion';
import { Send, CheckCircle2, XCircle, Eye, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Pagination from '@/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useModals } from '@/context/ModalContext';

export default function SentLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [trackingStatus, setTrackingStatus] = useState<string>('all');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [logDetails, setLogDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const pageSize = 15;

  const fetchData = async (p = page) => {
    try {
      const q = new URLSearchParams();
      q.set('page', p.toString());
      q.set('limit', pageSize.toString());
      if (selectedAccountId !== 'all') q.set('account_id', selectedAccountId);
      if (trackingStatus !== 'all') q.set('tracking_status', trackingStatus);

      const [logRes, accRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/send-log?${q.toString()}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts`)
      ]);
      const logData = await logRes.json();
      const accData = await accRes.json();
      setLogs(logData.log || []);
      setTotal(logData.total || 0);
      setAccounts(accData.accounts || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData(page);
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/live-log`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'opened') {
          setLogs(prev => prev.map(l => l.id === data.log_id ? { ...l, opened: 1, open_count: data.open_count } : l));
          setLogDetails((prev: any) => prev && prev.id === data.log_id ? { ...prev, opened: 1, open_count: data.open_count } : prev);
        } else if (data.type === 'sent' || data.type === 'failed') {
          fetchData(page);
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [page, selectedAccountId, trackingStatus]);

  const getEmail = (id: number) => accounts.find(a => a.id === id)?.email || 'Unknown';
  const getProvider = (id: number) => accounts.find(a => a.id === id)?.provider || 'Unknown';

  const handleViewDetails = async (logId: number) => {
    setSelectedLogId(logId); setLoadingDetails(true);
    try { const d = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/send-log/${logId}/details`)).json(); setLogDetails(d); }
    catch (err) { console.error(err); } finally { setLoadingDetails(false); }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/send-log/${itemToDelete.id}`, { method: 'DELETE' });
      fetchData(page);
    } catch (err) { console.error(err); }
  };

  const { showConfirm } = useModals();

  const handleDeleteAll = async () => {
    if (logs.length === 0) return;
    const confirmed = await showConfirm('Delete All Logs', 'Are you sure you want to soft-delete ALL dispatch logs? They will be moved to the Trash.');
    if (!confirmed) return;
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/sent_emails/delete-all`, { method: 'POST' });
    setLoading(false);
    fetchData(1);
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0C0D10]">Sent Logs</h1>
          <p className="text-[#8D909C] mt-1 text-sm">Unified record of all dispatched emails.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {logs.length > 0 && (
            <button onClick={handleDeleteAll} disabled={loading}
              className="px-4 py-2 bg-[rgba(239,68,68,.08)] text-[#EF4444] font-semibold rounded-lg text-xs border border-[rgba(239,68,68,.2)] hover:bg-[rgba(239,68,68,.14)] transition-colors flex items-center gap-2 disabled:opacity-50 h-[34px]">
              <Trash2 size={14} /> Delete All
            </button>
          )}
          <select value={selectedAccountId} onChange={e => { setSelectedAccountId(e.target.value); setPage(1); }}
            className="bg-white border border-[#D8DADF] text-[#0C0D10] px-3 py-2 rounded-lg font-mono text-xs focus:outline-none focus:border-[#1297FD] transition-colors shadow-sm h-[34px]">
            <option value="all">All Accounts</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id.toString()}>{acc.email}</option>)}
          </select>
          <select value={trackingStatus} onChange={e => { setTrackingStatus(e.target.value); setPage(1); }}
            className="bg-white border border-[#D8DADF] text-[#0C0D10] px-3 py-2 rounded-lg font-mono text-xs focus:outline-none focus:border-[#1297FD] transition-colors shadow-sm h-[34px]">
            <option value="all">Tracking: All</option>
            <option value="opened">Opened Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#E8E9EC] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#8D909C] font-mono animate-pulse text-sm">Loading logs...</div>
        ) : (
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead className="bg-[#F2F3F5] border-b border-[#E8E9EC]">
              <tr>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Timestamp</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Recipient</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Sender</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal text-right">Delivery</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal text-right">Tracking</th>
                <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E9EC]">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-[#8D909C]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#F2F3F5] flex items-center justify-center"><Send size={26} className="text-[#D8DADF]" /></div>
                    <p className="font-medium text-[#474A56]">No emails found.</p>
                  </div>
                </td></tr>
              ) : logs.map((log, i) => (
                <tr key={i} className="hover:bg-[rgba(18,151,253,.025)] transition-colors">
                  <td className="px-6 py-4 font-mono text-[#8D909C] text-xs whitespace-nowrap">{new Date(log.sent_at + 'Z').toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-[#474A56]">{log.recipient}</td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-[#1297FD] text-sm truncate max-w-[200px]">{getEmail(log.account_id)}</div>
                    <div className="text-[10px] text-[#8D909C] uppercase tracking-wider">{getProvider(log.account_id)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {log.status === 'sent' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(34,197,94,.1)] text-[#15803D] text-[10px] font-mono border border-[rgba(34,197,94,.18)]"><CheckCircle2 size={11} /> SENT</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(239,68,68,.08)] text-[#DC2626] text-[10px] font-mono border border-[rgba(239,68,68,.15)]"><XCircle size={11} /> FAILED</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {log.opened > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(18,151,253,.1)] text-[#1297FD] text-[10px] font-mono border border-[rgba(18,151,253,.2)]"><Eye size={11} /> OPENED</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(141,144,156,.1)] text-[#8D909C] text-[10px] font-mono border border-[rgba(141,144,156,.18)]">PENDING</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleViewDetails(log.id)} className="p-2 text-[#8D909C] hover:text-[#1297FD] hover:bg-[rgba(18,151,253,.07)] rounded-lg transition-colors"><Eye size={17} /></button>
                    <button onClick={() => { setItemToDelete(log); setDeleteModalOpen(true); }} className="p-2 text-[#8D909C] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,.06)] rounded-lg transition-colors"><Trash2 size={17} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {logs.length > 0 && (
          <div className="p-4 border-t border-[#E8E9EC]">
            <Pagination
              totalItems={total}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => { setSelectedLogId(null); setLogDetails(null); }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border border-[#E8E9EC] rounded-2xl shadow-lg w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#E8E9EC] flex justify-between items-center bg-[#F2F3F5]">
              <h2 className="text-base font-bold text-[#0C0D10]">Email Details</h2>
              <button onClick={() => { setSelectedLogId(null); setLogDetails(null); }} className="p-1.5 text-[#8D909C] hover:text-[#0C0D10] hover:bg-white rounded-lg transition-colors"><XCircle size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {loadingDetails ? (
                <div className="flex items-center justify-center p-12 text-[#1297FD] font-mono animate-pulse gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-[#1297FD] border-r-transparent animate-spin" /> Loading...
                </div>
              ) : logDetails ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Recipient', value: logDetails.recipient, cls: 'text-[#0C0D10]' },
                      { label: 'Sender', value: getEmail(logDetails.account_id), cls: 'text-[#1297FD]' },
                      { label: 'Status', value: logDetails.status === 'sent' ? 'Delivered' : `Failed: ${logDetails.error_msg}`, cls: logDetails.status === 'sent' ? 'text-[#15803D] font-semibold' : 'text-[#DC2626] font-semibold' },
                      { label: 'Engagement', value: logDetails.opened === 1 ? `Opened (${logDetails.open_count}x)` : 'Not opened', cls: logDetails.opened === 1 ? 'text-[#1297FD] font-semibold' : 'text-[#8D909C]' },
                    ].map(item => (
                      <div key={item.label} className="bg-[#F2F3F5] p-4 rounded-xl border border-[#E8E9EC]">
                        <span className="text-[10px] text-[#8D909C] font-mono uppercase tracking-wider block mb-1">{item.label}</span>
                        <span className={`text-sm font-medium ${item.cls}`}>{item.value}</span>
                      </div>
                    ))}
                    {logDetails.attachment_filename && (
                      <div className="bg-[#F2F3F5] p-4 rounded-xl border border-[#E8E9EC] col-span-2">
                        <span className="text-[10px] text-[#8D909C] font-mono uppercase tracking-wider block mb-1">Attachment</span>
                        <span className="text-sm font-medium text-[#1297FD]">{logDetails.attachment_filename}</span>
                      </div>
                    )}
                  </div>
                  <div className="border border-[#E8E9EC] rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-[#E8E9EC] bg-[#F2F3F5]">
                      <span className="text-[10px] text-[#8D909C] font-mono uppercase tracking-wider block mb-1">Subject</span>
                      <p className="font-semibold text-[#0C0D10]">{logDetails.reconstructed_subject}</p>
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] text-[#8D909C] font-mono uppercase tracking-wider block mb-3">Email Body</span>
                      <div className="text-sm text-[#474A56] bg-[#F2F3F5] p-5 rounded-xl border border-[#E8E9EC] prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: logDetails.reconstructed_body }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-12 text-[#EF4444] text-sm">Failed to load details.</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDelete}
        itemName={itemToDelete ? `sent email to ${itemToDelete.recipient}` : 'this email'}
      />
    </div>
  );
}
