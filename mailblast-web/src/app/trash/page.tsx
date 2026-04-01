'use client';

import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, RefreshCw, XCircle, Search, Layers, Send, Users, LayoutTemplate } from 'lucide-react';
import { useState, useEffect } from 'react';
import Pagination from '@/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useModals } from '@/context/ModalContext';

const TABS = [
  { id: 'campaigns', label: 'Campaigns', icon: Layers },
  { id: 'sent_emails', label: 'Sent Emails', icon: Send },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
];

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const pageSize = 15;
  const { showConfirm } = useModals();

  const fetchTrash = async (p = page, tab = activeTab) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/${tab}?page=${p}&limit=${pageSize}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTrash(1, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (page > 1) fetchTrash(page, activeTab);
  }, [page]);

  const handleRestore = async (id: number) => {
    setActionLoading(id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/${activeTab}/${id}/restore`, { method: 'POST' });
      fetchTrash(page);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async () => {
    if (!itemToDelete) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/${activeTab}/${itemToDelete.id}/hard`, { method: 'DELETE' });
      fetchTrash(page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmptyTrash = async () => {
    const confirmed = await showConfirm('Empty Trash', `Are you sure you want to permanently empty the ${TABS.find(t => t.id === activeTab)?.label} trash? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/${activeTab}/empty`, { method: 'POST' });
      fetchTrash(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreAll = async () => {
    const confirmed = await showConfirm('Restore All', `Are you sure you want to restore all items in the ${TABS.find(t => t.id === activeTab)?.label} trash?`);
    if (!confirmed) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trash/${activeTab}/restore-all`, { method: 'POST' });
      fetchTrash(1);
    } catch (err) {
      console.error(err);
    }
  };

  const renderItemDetails = (item: any) => {
    if (activeTab === 'campaigns') {
      return (
        <>
          <td className="px-6 py-4 font-medium text-[#0C0D10]">{item.name || `Campaign #${item.id}`}</td>
          <td className="px-6 py-4 text-xs text-[#8D909C]">Subject: {item.subject}</td>
        </>
      );
    }
    if (activeTab === 'sent_emails') {
      return (
        <>
          <td className="px-6 py-4 font-medium text-[#0C0D10]">{item.recipient}</td>
          <td className="px-6 py-4 text-xs text-[#8D909C]">Status: {item.status}</td>
        </>
      );
    }
    if (activeTab === 'accounts') {
      return (
        <>
          <td className="px-6 py-4 font-medium text-[#0C0D10]">{item.email}</td>
          <td className="px-6 py-4 text-xs text-[#8D909C]">{item.provider}</td>
        </>
      );
    }
    if (activeTab === 'templates') {
      return (
        <>
          <td className="px-6 py-4 font-medium text-[#0C0D10]">{item.name}</td>
          <td className="px-6 py-4 text-xs text-[#8D909C]">Subject: {item.subject}</td>
        </>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0C0D10] flex items-center gap-2">
            <Trash2 size={24} className="text-[#EF4444]" /> Trash
          </h1>
          <p className="text-[#8D909C] mt-1 text-sm">Items here will be permanently deleted after 7 days.</p>
        </div>
        
        {items.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={handleRestoreAll}
              className="px-4 py-2 bg-[rgba(34,197,94,.1)] text-[#15803D] border border-[rgba(34,197,94,.3)] rounded-lg text-sm font-semibold hover:bg-[rgba(34,197,94,.15)] transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} /> Restore All
            </button>
            <button 
              onClick={handleEmptyTrash}
              className="px-4 py-2 bg-[rgba(239,68,68,.08)] text-[#EF4444] border border-[rgba(239,68,68,.2)] rounded-lg text-sm font-semibold hover:bg-[rgba(239,68,68,.14)] transition-colors flex items-center gap-2"
            >
              <AlertTriangle size={16} /> Empty {TABS.find(t => t.id === activeTab)?.label} Trash
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#E8E9EC]">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium text-sm transition-colors whitespace-nowrap mb-[-1px] ${
                active 
                  ? 'border-[#1297FD] text-[#1297FD]' 
                  : 'border-transparent text-[#8D909C] hover:text-[#0C0D10] hover:bg-[#F2F3F5] rounded-t-lg'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-[#E8E9EC] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-[#F2F3F5] border-b border-[#E8E9EC]">
            <tr>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Deleted On</th>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Item Details</th>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal">Context</th>
              <th className="px-6 py-3 text-[10px] font-mono text-[#8D909C] uppercase tracking-wider font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E9EC]">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-16 text-center text-[#8D909C] animate-pulse">Loading deleted items...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F2F3F5] text-[#D8DADF] flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={28} />
                  </div>
                  <p className="font-semibold text-[#474A56]">Trash is empty</p>
                  <p className="text-sm text-[#8D909C] mt-1">No deleted {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} found.</p>
                </td>
              </tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-6 py-4">
                  <span className="text-xs text-[#474A56] bg-[#F2F3F5] px-2 py-1 rounded">
                    {new Date(item.deleted_at + 'Z').toLocaleString()}
                  </span>
                </td>
                
                {renderItemDetails(item)}

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleRestore(item.id)}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#15803D] bg-[rgba(34,197,94,.1)] hover:bg-[rgba(34,197,94,.2)] rounded-lg transition-colors border border-[rgba(34,197,94,.2)] disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={actionLoading === item.id ? "animate-spin" : ""} /> Restore
                    </button>
                    <button 
                      onClick={() => { setItemToDelete(item); setDeleteModalOpen(true); }}
                      disabled={actionLoading === item.id}
                      className="p-1.5 text-[#8D909C] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Permanently Delete"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length > 0 && (
          <div className="p-4 border-t border-[#E8E9EC]">
            <Pagination
              totalItems={total}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleHardDelete}
        itemName="this item permanently"
        isHardDelete={true}
      />
    </div>
  );
}
