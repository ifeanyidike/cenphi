// components/ai-generated-content/ApprovalActionBar.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalActionBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ApprovalActionBar: React.FC<ApprovalActionBarProps> = ({
  selectedCount,
  onApprove,
  onReject,
  onCancel,
  loading = false,
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-700">
                  {selectedCount}
                </span>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                {selectedCount === 1 ? "1 item selected" : `${selectedCount} items selected`}
              </span>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onApprove}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span className="ml-1.5">Approve</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={loading}
                className="border-rose-200 text-rose-700 hover:bg-rose-50 h-8 px-3 text-xs"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                <span className="ml-1.5">Reject</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApprovalActionBar;
