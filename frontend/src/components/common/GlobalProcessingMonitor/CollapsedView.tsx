/**
 * CollapsedView Component - Minimal Processing Monitor
 *
 * Professional, minimalist design for monitoring AI processing jobs
 * Features:
 * - Minimal color usage (subtle grays, single accent color)
 * - No time-based labels
 * - Clean, understated animations
 * - Professional design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, Pause, CheckCircle2, ChevronRight } from 'lucide-react';
import { ActiveJob } from '@/contexts/ProcessingMonitorContext';

interface CollapsedViewProps {
  jobs: ActiveJob[];
  onClick: () => void;
}

export const CollapsedView: React.FC<CollapsedViewProps> = ({
  jobs,
  onClick,
}) => {
  const jobCount = jobs.length;

  // Determine primary status (priority: failed > paused > processing > completed)
  const hasFailedJob = jobs.some(j => j.status === 'failed' || j.hasFailedStage);
  const hasPausedJob = jobs.some(j => j.status === 'paused');
  const isProcessing = jobs.some(j => j.status === 'processing');

  // Status configuration - MINIMAL COLORS
  const getStatusConfig = () => {
    if (hasFailedJob) {
      const failedJob = jobs.find(j => j.status === 'failed' || j.hasFailedStage);
      return {
        icon: AlertCircle,
        iconColor: 'text-red-600',
        label: 'Failed',
        message: jobCount === 1 && failedJob ? failedJob.serviceName : `${jobCount} jobs`,
      };
    }
    if (hasPausedJob) {
      const pausedJob = jobs.find(j => j.status === 'paused');
      return {
        icon: Pause,
        iconColor: 'text-slate-600',
        label: 'Paused',
        message: jobCount === 1 && pausedJob ? pausedJob.serviceName : `${jobCount} jobs`,
      };
    }
    if (isProcessing) {
      const processingJob = jobs.find(j => j.status === 'processing');
      return {
        icon: Activity,
        iconColor: 'text-slate-700',
        label: jobCount === 1 && processingJob ? processingJob.serviceName : 'Processing',
        message: jobCount === 1 && processingJob ? processingJob.stageDisplayName : `${jobCount} jobs`,
      };
    }
    // All jobs completed
    const completedJob = jobs[0];
    return {
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      label: jobCount === 1 && completedJob ? completedJob.serviceName : 'Complete',
      message: jobCount === 1 ? 'Click to view' : `${jobCount} jobs ready`,
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group"
    >
      {/* Simple card with minimal styling */}
      <div className="
        bg-white dark:bg-slate-900
        rounded-lg
        border border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-md
        transition-all duration-200
        overflow-hidden
        min-w-[220px]
      ">
        {/* Content */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Simple icon - no fancy animations */}
          <div className={`
            w-7 h-7 rounded-md
            bg-slate-50 dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            flex items-center justify-center
            flex-shrink-0
          `}>
            <StatusIcon className={`w-3.5 h-3.5 ${status.iconColor}`} strokeWidth={2.5} />
          </div>

          {/* Text content - smaller fonts */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                {status.label}
              </span>
              {jobCount > 1 && (
                <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  {jobCount}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {status.message}
            </p>
          </div>

          {/* Simple chevron */}
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        </div>

        {/* Minimal progress indicator (only for processing, no movement) */}
        {isProcessing && (
          <div className="h-[2px] bg-slate-100 dark:bg-slate-800">
            <div className="h-full w-1/3 bg-slate-400 dark:bg-slate-600" />
          </div>
        )}
      </div>
    </motion.button>
  );
};
