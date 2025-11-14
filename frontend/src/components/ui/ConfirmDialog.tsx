import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIconConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="h-6 w-6" />,
          bgColor: "bg-red-50",
          iconColor: "text-red-600",
          borderColor: "border-red-200",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          bgColor: "bg-amber-50",
          iconColor: "text-amber-600",
          borderColor: "border-amber-200",
        };
      case "info":
        return {
          icon: <Info className="h-6 w-6" />,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          borderColor: "border-blue-200",
        };
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white";
    }
  };

  if (!isOpen) return null;

  const iconConfig = getIconConfig();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon Header */}
            <div className={`flex items-center justify-center pt-8 pb-5 ${iconConfig.bgColor}`}>
              <div className={`w-14 h-14 rounded-full ${iconConfig.bgColor} ${iconConfig.borderColor} border-2 flex items-center justify-center ${iconConfig.iconColor}`}>
                {iconConfig.icon}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 bg-white">
              <h2 className="text-xl font-semibold text-slate-900 text-center mb-2.5">
                {title}
              </h2>
              <p className="text-[13px] text-slate-600 text-center leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 pb-6 bg-white">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 h-10 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                className={`flex-1 h-10 font-medium text-sm shadow-sm ${getConfirmButtonClass()}`}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: "danger" | "warning" | "info" | "success";
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = "info",
}) => {
  const getIconConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="h-6 w-6" />,
          bgColor: "bg-red-50",
          iconColor: "text-red-600",
          borderColor: "border-red-200",
          buttonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          bgColor: "bg-amber-50",
          iconColor: "text-amber-600",
          borderColor: "border-amber-200",
          buttonClass: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        };
      case "success":
        return {
          icon: <Info className="h-6 w-6" />,
          bgColor: "bg-emerald-50",
          iconColor: "text-emerald-600",
          borderColor: "border-emerald-200",
          buttonClass: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
        };
      case "info":
        return {
          icon: <Info className="h-6 w-6" />,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          borderColor: "border-blue-200",
          buttonClass: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        };
    }
  };

  if (!isOpen) return null;

  const iconConfig = getIconConfig();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon Header */}
            <div className={`flex items-center justify-center pt-8 pb-5 ${iconConfig.bgColor}`}>
              <div className={`w-14 h-14 rounded-full ${iconConfig.bgColor} ${iconConfig.borderColor} border-2 flex items-center justify-center ${iconConfig.iconColor}`}>
                {iconConfig.icon}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 bg-white">
              <h2 className="text-xl font-semibold text-slate-900 text-center mb-2.5">
                {title}
              </h2>
              <p className="text-[13px] text-slate-600 text-center leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center px-6 pb-6 bg-white">
              <Button
                onClick={onClose}
                className={`min-w-[120px] h-10 font-medium text-sm text-white shadow-sm ${iconConfig.buttonClass}`}
              >
                OK
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
