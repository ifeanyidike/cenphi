/**
 * ExpandedView Component - Job List Display
 *
 * Clean interface for viewing all active processing jobs
 * Features:
 * - Minimal color usage
 * - Professional layout
 * - Always clickable to access studio
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, History } from 'lucide-react';
import { ActiveJob } from '@/contexts/ProcessingMonitorContext';
import { JobCard } from './JobCard';

interface ExpandedViewProps {
  jobs: ActiveJob[];
  onCollapse: () => void;
  onRemoveJob: (sessionId: string) => void;
  onJobClick: (sessionId: string) => void;
  onShowHistory?: () => void; // Optional - only shown if history exists
}

export const ExpandedView: React.FC<ExpandedViewProps> = ({
  jobs,
  onCollapse,
  onRemoveJob,
  onJobClick,
  onShowHistory,
}) => {
  // Determine status indicator
  const hasFailedJob = jobs.some(j => j.status === 'failed' || j.hasFailedStage);
  const isProcessing = jobs.some(j => j.status === 'processing');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-[340px]"
    >
      {/* Simple card */}
      <div className="
        bg-white dark:bg-slate-900
        rounded-lg
        border border-slate-200 dark:border-slate-700
        shadow-lg
        overflow-hidden
        max-h-[500px]
        flex flex-col
      ">
        {/* Header */}
        <div className="
          px-3 py-3
          border-b border-slate-200 dark:border-slate-700
          bg-slate-50/50 dark:bg-slate-800/50
        ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Simple status dot - MINIMAL */}
              <div className={`
                w-1.5 h-1.5 rounded-full
                ${hasFailedJob
                  ? 'bg-red-600'
                  : isProcessing
                  ? 'bg-slate-400'
                  : 'bg-slate-400'
                }
              `} />

              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {hasFailedJob ? 'Attention Needed' : 'Active Jobs'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                </p>
              </div>
            </div>

            <button
              onClick={onCollapse}
              className="
                p-1.5 rounded
                hover:bg-slate-100 dark:hover:bg-slate-800
                transition-colors
                text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
              "
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Job List */}
        <div className="
          flex-1
          overflow-y-auto
          px-2.5 py-2.5
          space-y-2
        ">
          <AnimatePresence mode="popLayout">
            {jobs.map((job, index) => (
              <motion.div
                key={job.sessionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50, height: 0 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 300,
                  delay: index * 0.03
                }}
              >
                <JobCard
                  job={job}
                  onRemove={onRemoveJob}
                  onClick={onJobClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="
          px-3 py-2.5
          border-t border-slate-200 dark:border-slate-700
          bg-slate-50/50 dark:bg-slate-800/50
        ">
          {onShowHistory ? (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Click any job to view
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onShowHistory}
                className="
                  inline-flex items-center gap-1
                  px-2 py-1
                  bg-slate-100 dark:bg-slate-800
                  hover:bg-slate-200 dark:hover:bg-slate-700
                  rounded
                  text-[10px] font-medium
                  text-slate-700 dark:text-slate-300
                  transition-colors
                "
              >
                <History className="w-2.5 h-2.5" />
                View History
              </motion.button>
            </div>
          ) : (
            <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
              Click any job to view in studio
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
