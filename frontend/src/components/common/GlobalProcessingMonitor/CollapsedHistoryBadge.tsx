/**
 * CollapsedHistoryBadge - Minimal badge for accessing processing history
 * Shows when no active jobs but history exists
 */

import React from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';

interface CollapsedHistoryBadgeProps {
  count: number;
  onClick: () => void;
}

export const CollapsedHistoryBadge: React.FC<CollapsedHistoryBadgeProps> = ({
  count,
  onClick,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
      title="View Processing History"
    >
      {/* History Icon */}
      <History className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-900 transition-colors" />

      {/* Count Badge */}
      <span className="text-[10px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
        {count}
      </span>

      {/* Tooltip on hover */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-slate-900 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      >
        View History
      </motion.div>
    </motion.button>
  );
};
