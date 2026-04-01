'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, Server, Trash2, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModals } from '@/context/ModalContext';
import Pagination from '@/components/ui/Pagination';

export default function Accounts() {
  const { showConfirm } = useModals();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;
  const [formData, setFormData] = useState({
    display_name: '', email: '', password: '', provider: 'Custom Domain',
    smtp_host: '', smtp_port: '465', imap_host: '', imap_port: '993'
  });
  const [loading, setLoading] = useState(false);

  const loadAccounts = (p = page) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts?page=${p}&limit=${pageSize}`).then(r => r.json()).then(d => {
      setAccounts(d.accounts || []);
      setTotal(d.total || 0);
    }).catch(() => setAccounts([]));
  };
  useEffect(() => { loadAccounts(page); }, [page]);

  const handleSave = async (e: any) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts/add`;
      
      const res = await fetch(url, { 
        method: editingId ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData) 
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert("Error saving account: " + (data.error || data.detail || "Unknown error"));
      } else {
        setShowModal(false);
        setEditingId(null);
        loadAccounts(page);
      }
    } catch (error) {
      console.error("[Accounts] Save failed:", error);
      alert("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (provider: string, defaults: any) => {
    setEditingId(null); setFormData({ display_name: '', email: '', password: '', provider, ...defaults }); setShowModal(true);
  };

  const handleEdit = (acc: any) => {
    setEditingId(acc.id);
    setFormData({ display_name: acc.display_name || '', email: acc.email, password: '', provider: acc.provider, smtp_host: acc.smtp_host || '', smtp_port: acc.smtp_port?.toString() || '', imap_host: acc.imap_host || '', imap_port: acc.imap_port?.toString() || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm('Move to Trash', 'Are you sure you want to delete this account? It will be moved to the Trash and permanently deleted after 7 days.');
    if (!confirmed) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts/${id}`, { method: 'DELETE' });
    loadAccounts(page);
  };

  const handleDeleteAll = async () => {
    if (accounts.length === 0) return;
    const confirmed = await showConfirm('Delete All Accounts', 'Are you sure you want to soft-delete ALL accounts? They will be moved to the Trash.');
    if (!confirmed) return;
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/accounts/delete-all`, { method: 'POST' });
    setLoading(false);
    loadAccounts(1);
  };

  const inputCls = "w-full bg-white border border-[#D8DADF] rounded-lg px-3 py-2.5 text-sm text-[#0C0D10] focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)] transition-colors placeholder:text-[#8D909C]";

  return (
    <div className="space-y-8 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0C0D10]">Email Accounts</h1>
          <p className="text-[#8D909C] mt-1 text-sm">Manage your sending accounts and SMTP/IMAP endpoints.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {accounts.length > 0 && (
            <button onClick={handleDeleteAll} disabled={loading}
              className="px-4 py-2.5 bg-[rgba(239,68,68,.08)] text-[#EF4444] font-semibold rounded-lg text-sm border border-[rgba(239,68,68,.2)] hover:bg-[rgba(239,68,68,.14)] transition-colors flex items-center gap-2 disabled:opacity-50">
              <Trash2 size={16} /> Delete All
            </button>
          )}
          <button onClick={() => openModal('Gmail', { smtp_host: 'smtp.gmail.com', smtp_port: '587', imap_host: 'imap.gmail.com', imap_port: '993' })}
            className="px-4 py-2.5 bg-[rgba(234,67,53,.08)] text-[#EA4335] font-semibold rounded-lg text-sm border border-[rgba(234,67,53,.2)] hover:bg-[rgba(234,67,53,.14)] transition-colors">
            + Add Gmail
          </button>
          <button onClick={() => openModal('Custom Domain', { smtp_host: '', smtp_port: '465', imap_host: '', imap_port: '993' })}
            className="px-5 py-2.5 bg-[#1297FD] text-white rounded-lg flex items-center gap-2 hover:bg-[#0A82E0] font-semibold text-sm transition-colors shadow-sm">
            <Server size={16} /> Add Custom SMTP
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E8E9EC] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-[#F2F3F5] border-b border-[#E8E9EC]">
            <tr>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Provider</th>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Display Name</th>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Email Address</th>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Status</th>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E9EC]">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-[#8D909C]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#F2F3F5] flex items-center justify-center"><Mail size={28} className="text-[#D8DADF]" /></div>
                    <p className="font-medium text-[#474A56]">No accounts configured yet.</p>
                    <p className="text-sm">Click Add to connect your first sending account.</p>
                  </div>
                </td>
              </tr>
            ) : accounts.map((acc, i) => (
              <tr key={i} className="hover:bg-[rgba(18,151,253,.025)] transition-colors">
                <td className="px-6 py-4 font-mono text-[#1297FD] font-medium text-sm">{acc.provider}</td>
                <td className="px-6 py-4 font-medium text-[#0C0D10]">{acc.display_name || '—'}</td>
                <td className="px-6 py-4 font-medium text-[#474A56]">{acc.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(34,197,94,.1)] text-[#15803D] text-[10px] font-mono border border-[rgba(34,197,94,.18)]">
                    <CheckCircle2 size={11} /> ACTIVE
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(acc)} className="p-2 text-[#8D909C] hover:text-[#1297FD] hover:bg-[rgba(18,151,253,.07)] rounded-lg transition-colors mr-1"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(acc.id)} className="p-2 text-[#8D909C] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,.06)] rounded-lg transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {accounts.length > 0 && (
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

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-white border border-[#E8E9EC] rounded-2xl w-full max-w-[600px] p-6 lg:p-8 shadow-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-xl font-bold text-[#0C0D10] mb-1">{editingId ? `Edit ${formData.provider} Account` : `Add ${formData.provider} Account`}</h2>
              <p className="text-sm text-[#8D909C] mb-6 pb-5 border-b border-[#E8E9EC]">Passwords are AES-256 encrypted locally.</p>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-4 bg-[#F2F3F5] p-4 rounded-xl border border-[#E8E9EC]">
                  <h3 className="text-xs font-bold font-mono text-[#1297FD] uppercase tracking-wider">Account Credentials</h3>
                  <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Full Name / Display Name</label>
                    <input required type="text" value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })} className={inputCls} placeholder="John Doe" /></div>
                  <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="info@yourdomain.com" disabled={!!editingId} /></div>
                  <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">{editingId ? 'Password (leave blank to keep current)' : 'Email Password / App Password'}</label>
                    <input required={!editingId} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputCls} /></div>
                </div>

                {formData.provider !== 'Gmail' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4 bg-[#F2F3F5] p-4 rounded-xl border border-[#E8E9EC]">
                      <h3 className="text-xs font-bold font-mono text-[#22C55E] uppercase tracking-wider">SMTP (Outgoing)</h3>
                      <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">SMTP Server</label>
                        <input required value={formData.smtp_host} onChange={e => setFormData({ ...formData, smtp_host: e.target.value })} className={inputCls} placeholder="mail.yourdomain.com" /></div>
                      <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">SMTP Port</label>
                        <input required value={formData.smtp_port} onChange={e => setFormData({ ...formData, smtp_port: e.target.value })} className={inputCls} /></div>
                    </div>
                    <div className="space-y-4 bg-[#F2F3F5] p-4 rounded-xl border border-[#E8E9EC]">
                      <h3 className="text-xs font-bold font-mono text-[#1297FD] uppercase tracking-wider">IMAP (Incoming)</h3>
                      <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">IMAP Server</label>
                        <input required value={formData.imap_host} onChange={e => setFormData({ ...formData, imap_host: e.target.value })} className={inputCls} placeholder="mail.yourdomain.com" /></div>
                      <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">IMAP Port</label>
                        <input required value={formData.imap_port} onChange={e => setFormData({ ...formData, imap_port: e.target.value })} className={inputCls} /></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-[#E8E9EC]">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg border border-[#D8DADF] text-[#474A56] font-semibold text-sm hover:bg-[#F2F3F5] transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="px-7 py-2.5 bg-[#1297FD] text-white hover:bg-[#0A82E0] font-semibold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50">
                    {loading ? 'Saving...' : editingId ? 'Update Account' : 'Save Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
