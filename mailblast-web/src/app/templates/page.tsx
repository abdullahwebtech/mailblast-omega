'use client';

import { motion } from 'framer-motion';
import { LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useModals } from '@/context/ModalContext';

export default function Templates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 9; // Grid layout looks better with multiples of 3
  const [isModalOpen, setModalOpen] = useState(false);
  const [newTemp, setNewTemp] = useState({ name: '', subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const loadTemplates = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/templates?page=${p}&limit=${pageSize}`);
      const data = await res.json();
      setTemplates(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(page); }, [page]);

  const handleCreate = async () => {
    if (!newTemp.name || !newTemp.subject || !newTemp.body) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/templates/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemp)
      });
      setModalOpen(false);
      setNewTemp({ name: '', subject: '', body: '' });
      loadTemplates(page);
    } catch (err) { console.error(err); }
  };

  const handleRemove = async () => {
    if (!itemToDelete) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/templates/${itemToDelete.id}`, {
        method: 'DELETE'
      });
      loadTemplates(page);
    } catch (err) { console.error(err); }
  };

  const { showConfirm } = useModals();

  const handleDeleteAll = async () => {
    if (templates.length === 0) return;
    const confirmed = await showConfirm('Delete All Templates', 'Are you sure you want to soft-delete ALL templates? They will be moved to the Trash.');
    if (!confirmed) return;
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/templates/delete-all`, { method: 'POST' });
    setLoading(false);
    loadTemplates(1);
  };

  const handleUseTemplate = (t: any) => {
    localStorage.setItem('omega_draft_subject', t.subject);
    localStorage.setItem('omega_draft_body', t.body_plain || t.body);
    router.push('/composer');
  };

  const inputCls = "w-full bg-white border border-[#D8DADF] rounded-lg px-4 py-2.5 text-sm text-[#0C0D10] placeholder:text-[#8D909C] focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)] transition-colors";

  return (
    <div className="space-y-8 max-w-[1200px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0C0D10]">Templates</h1>
          <p className="text-[#8D909C] mt-1 text-sm">Manage reusable email copy structures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {templates.length > 0 && (
            <button onClick={handleDeleteAll} disabled={loading}
              className="px-4 py-2.5 bg-[rgba(239,68,68,.08)] text-[#EF4444] font-semibold rounded-lg text-sm border border-[rgba(239,68,68,.2)] hover:bg-[rgba(239,68,68,.14)] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
              <Trash2 size={16} /> Delete All
            </button>
          )}
          <button onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-[#1297FD] text-white font-semibold rounded-lg flex items-center gap-2 hover:bg-[#0A82E0] transition-colors shadow-sm">
            <Plus size={17} /> New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[#8D909C] font-mono animate-pulse">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[#D8DADF] rounded-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F2F3F5] flex items-center justify-center"><LayoutTemplate size={28} className="text-[#D8DADF]" /></div>
            <p className="font-semibold text-[#474A56]">No templates yet.</p>
            <p className="text-sm text-[#8D909C]">Create a template to reuse winning copy across campaigns.</p>
          </div>
        ) : templates.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E8E9EC] rounded-2xl p-5 flex flex-col group shadow-sm hover:border-[#8BCAF9] hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-[#0C0D10] text-base truncate pr-4">{t.name}</h3>
              <button onClick={() => { setItemToDelete(t); setDeleteModalOpen(true); }}
                className="p-1.5 text-[#8D909C] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,.06)] rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={15} /></button>
            </div>
            <div className="bg-[rgba(18,151,253,.06)] border border-[rgba(18,151,253,.14)] rounded-lg p-3 mb-3 text-xs font-mono text-[#1297FD] truncate">
              {t.subject}
            </div>
            <div className="text-sm text-[#474A56] flex-1 line-clamp-4 leading-relaxed bg-[#F2F3F5] p-3 rounded-lg border border-[#E8E9EC]">
              {t.body_plain || t.body}
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8E9EC] flex justify-between items-center">
              <span className="text-xs text-[#8D909C]">{t.created_at ? new Date(t.created_at + (t.created_at.includes('Z') ? '' : 'Z')).toLocaleDateString() : 'N/A'}</span>
              <button onClick={() => handleUseTemplate(t)}
                className="text-xs font-semibold text-[#1297FD] hover:text-[#0A82E0] transition-colors">
                Use Template →
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {templates.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            totalItems={total}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border border-[#E8E9EC] rounded-2xl w-full max-w-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[#0C0D10] mb-5">Create New Template</h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Template Name</label>
                <input value={newTemp.name} onChange={e => setNewTemp({ ...newTemp, name: e.target.value })} type="text" placeholder="e.g. Cold Outreach v1" className={inputCls} /></div>
              <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Subject Line</label>
                <input value={newTemp.subject} onChange={e => setNewTemp({ ...newTemp, subject: e.target.value })} type="text" placeholder="Email subject..." className={inputCls} /></div>
              <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Email Body</label>
                <textarea value={newTemp.body} onChange={e => setNewTemp({ ...newTemp, body: e.target.value })} rows={8} placeholder="Email body..." className={`${inputCls} resize-none`} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-[#D8DADF] text-[#474A56] font-semibold text-sm hover:bg-[#F2F3F5] transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newTemp.name || !newTemp.subject || !newTemp.body}
                className="px-7 py-2.5 bg-[#1297FD] text-white font-semibold rounded-lg text-sm hover:bg-[#0A82E0] transition-colors shadow-sm disabled:opacity-50">
                Save Template
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleRemove}
        itemName={itemToDelete ? `template "${itemToDelete.name}"` : 'this template'}
      />
    </div>
  );
}
