/**
 * JobCard Component - Individual Job Display
 *
 * Clean, minimal card for each processing job
 * Features:
 * - Minimal color usage
 * - Video thumbnail preview (not image)
 * - No time labels
 * - Always clickable to access studio
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ActiveJob } from '@/contexts/ProcessingMonitorContext';
import {
  getServiceShortName,
} from '@/utils/studioHelpers';
import { AlertCircle, Pause, CheckCircle2, X, Activity, Play } from 'lucide-react';

interface JobCardProps {
  job: ActiveJob;
  onRemove: (sessionId: string) => void;
  onClick: (sessionId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onRemove, onClick }) => {
  const handleNavigate = (e: React.MouseEvent) => {
    // Don't navigate if clicking remove button
    if ((e.target as HTMLElement).closest('[data-remove-button]')) {
      return;
    }
    onClick(job.sessionId);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(job.sessionId);
  };

  // Get status configuration - MINIMAL COLORS
  const getStatusConfig = () => {
    if (job.status === 'failed' || job.hasFailedStage) {
      return {
        icon: AlertCircle,
        iconColor: 'text-red-600',
        borderColor: 'border-red-200 dark:border-red-900/30',
        bgColor: 'bg-red-50/30 dark:bg-red-900/5',
        message: 'Action needed',
      };
    }
    if (job.status === 'paused') {
      return {
        icon: Pause,
        iconColor: 'text-slate-600',
        borderColor: 'border-slate-200 dark:border-slate-700',
        bgColor: 'bg-slate-50/30 dark:bg-slate-800/30',
        message: 'Paused',
      };
    }
    if (job.status === 'completed') {
      return {
        icon: CheckCircle2,
        iconColor: 'text-slate-700',
        borderColor: 'border-slate-200 dark:border-slate-700',
        bgColor: 'bg-slate-50/30 dark:bg-slate-800/30',
        message: 'Ready',
      };
    }
    return {
      icon: Activity,
      iconColor: 'text-slate-700',
      borderColor: 'border-slate-200 dark:border-slate-700',
      bgColor: 'bg-slate-50/30 dark:bg-slate-800/30',
      message: 'Processing',
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const isProcessing = job.status === 'processing';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative cursor-pointer"
      onClick={handleNavigate}
    >
      <div className={`
        relative
        bg-white dark:bg-slate-800/50
        rounded-lg
        border ${config.borderColor}
        ${config.bgColor}
        p-2.5
        transition-all duration-200
        hover:shadow-sm
        overflow-hidden
      `}>
        {/* Content */}
        <div className="relative flex items-start gap-2.5">
          {/* Video Preview or Icon */}
          <div className="relative flex-shrink-0">
            {job.previewUrl ? (
              // Video thumbnail preview
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group">
                <video
                  src={job.previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                {/* Play overlay hint */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-4 h-4 text-white" fill="white" />
                </div>
              </div>
            ) : (
              // Icon fallback
              <div className="
                w-12 h-12 rounded-md
                bg-slate-50 dark:bg-slate-900
                border border-slate-200 dark:border-slate-700
                flex items-center justify-center
              ">
                <StatusIcon className={`w-4 h-4 ${config.iconColor}`} strokeWidth={2.5} />
              </div>
            )}

            {/* Status indicator dot */}
            <div className={`
              absolute -top-0.5 -right-0.5
              w-2.5 h-2.5 rounded-full ${config.iconColor.replace('text-', 'bg-')}
              border-2 border-white dark:border-slate-800
            `} />
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {getServiceShortName(job.serviceType)}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {job.stageDisplayName}
                </p>
              </div>

              {/* Remove button */}
              <button
                data-remove-button
                onClick={handleRemove}
                className="
                  opacity-0 group-hover:opacity-100
                  p-1 rounded
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  transition-all
                  text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                "
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Status - NO TIME */}
            <div className="mt-1.5">
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                {config.message}
              </span>
            </div>

            {/* Simple indicator bar (only for processing, no animation) */}
            {isProcessing && (
              <div className="relative mt-1.5 h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-slate-400 dark:bg-slate-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
