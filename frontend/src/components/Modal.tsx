import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg sm:w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden z-10"
          >
            {/* Sticky header */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
              <h2 className="font-heading text-xl font-semibold">{title}</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-4 sm:pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
