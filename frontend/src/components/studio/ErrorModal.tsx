import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'success' | 'info';
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'error',
}) => {
  if (!isOpen) return null;

  const iconConfig = {
    error: { Icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
    success: { Icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    info: { Icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  };

  const { Icon, color, bgColor } = iconConfig[type];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60">
            <h3 className="text-base font-semibold text-slate-900">
              {title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Information')}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg ${bgColor} flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed flex-1 pt-1">
                {message}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/60 flex justify-end">
            <Button
              onClick={onClose}
              className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
            >
              OK
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ErrorModal;
