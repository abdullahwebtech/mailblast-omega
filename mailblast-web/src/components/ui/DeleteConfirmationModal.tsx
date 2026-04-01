import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemName?: string;
  isHardDelete?: boolean;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName = "this item", isHardDelete = false }: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0C0D10]/40 backdrop-blur-sm"
            onClick={!isDeleting ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E9EC]">
              <h3 className="text-lg font-bold text-[#0C0D10] flex items-center gap-2">
                <AlertTriangle size={20} className="text-[#EF4444]" />
                Confirm Deletion
              </h3>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="p-2 -mr-2 text-[#8D909C] hover:text-[#0C0D10] transition-colors rounded-lg hover:bg-[#F2F3F5] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-[#991B1B] text-sm mb-6">
                {isHardDelete ? (
                  <p><strong>Warning:</strong> You are about to permanently delete {itemName}. This action is irreversible and the item cannot be recovered.</p>
                ) : (
                  <p>Are you sure you want to delete <strong>{itemName}</strong>? This item will be moved to the Trash and permanently deleted after 7 days.</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-[#0C0D10] bg-white border border-[#E8E9EC] rounded-lg hover:bg-[#F2F3F5] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#EF4444] rounded-lg hover:bg-[#DC2626] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isDeleting ? 'Deleting...' : isHardDelete ? 'Permanently Delete' : 'Move to Trash'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
