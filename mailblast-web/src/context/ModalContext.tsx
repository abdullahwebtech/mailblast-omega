'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, HelpCircle, Type, X } from 'lucide-react';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  defaultValue?: string;
  resolve: (value: any) => void;
}

interface ModalContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showPrompt: (title: string, message: string, defaultValue?: string) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalState | null>(null);

  const showAlert = (title: string, message: string) =>
    new Promise<void>((resolve) => setModal({ isOpen: true, type: 'alert', title, message, resolve }));

  const showConfirm = (title: string, message: string) =>
    new Promise<boolean>((resolve) => setModal({ isOpen: true, type: 'confirm', title, message, resolve }));

  const showPrompt = (title: string, message: string, defaultValue?: string) =>
    new Promise<string | null>((resolve) => setModal({ isOpen: true, type: 'prompt', title, message, defaultValue, resolve }));

  const close = (value: any) => {
    if (modal) { modal.resolve(value); setModal(null); }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {modal && <ModalRenderer modal={modal} onClose={close} />}
    </ModalContext.Provider>
  );
};

export const useModals = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModals must be used within a ModalProvider');
  return ctx;
};

const ModalRenderer = ({ modal, onClose }: { modal: ModalState; onClose: (val: any) => void }) => {
  const [inputValue, setInputValue] = useState(modal.defaultValue || '');

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => modal.type !== 'prompt' && onClose(false)}
        className="absolute inset-0 bg-[#0C0D10]/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E9EC]">
          <h3 className="text-lg font-bold text-[#0C0D10] flex items-center gap-2">
            {modal.type === 'alert' && <AlertCircle size={20} className="text-[#F59E0B]" />}
            {modal.type === 'confirm' && <HelpCircle size={20} className="text-[#1297FD]" />}
            {modal.type === 'prompt' && <Type size={20} className="text-[#7C3AED]" />}
            {modal.title}
          </h3>
          <button
            onClick={() => onClose(null)}
            className="p-2 -mr-2 text-[#8D909C] hover:text-[#0C0D10] transition-colors rounded-lg hover:bg-[#F2F3F5]"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className={`border rounded-xl p-4 text-sm mb-6 ${
            modal.type === 'alert' ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]' :
            modal.type === 'confirm' ? 'bg-[#F2F3F5] border-[#E8E9EC] text-[#0C0D10]' :
            'bg-[#FAF5FF] border-[#E9D5FF] text-[#6D28D9]'
          }`}>
            <p>{modal.message}</p>
          </div>

          {modal.type === 'prompt' && (
            <div className="mb-6">
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onClose(inputValue)}
                className="w-full bg-white border border-[#D8DADF] rounded-lg px-4 py-2.5 text-sm text-[#0C0D10] focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)] transition-colors"
                placeholder="Enter value..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            {modal.type !== 'alert' && (
              <button
                onClick={() => onClose(null)}
                className="px-4 py-2 text-sm font-medium text-[#0C0D10] bg-white border border-[#E8E9EC] rounded-lg hover:bg-[#F2F3F5] transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => onClose(modal.type === 'prompt' ? inputValue : true)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
                modal.type === 'alert' ? 'bg-[#F59E0B] hover:bg-[#D97706]' :
                modal.type === 'confirm' ? 'bg-[#1297FD] hover:bg-[#0A82E0]' :
                'bg-[#7C3AED] hover:bg-[#6D28D9]'
              }`}
            >
              {modal.type === 'alert' ? 'OK' : modal.type === 'confirm' ? 'Confirm' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
