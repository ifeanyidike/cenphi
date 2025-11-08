/**
 * HistoryView - Display completed/failed jobs from processing history
 * Shows jobs that have been completed or failed and moved to history
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Ban, ExternalLink, Trash2, Info, X } from 'lucide-react';
import { CompletedJob } from '@/contexts/ProcessingMonitorContext';
import { useNavigate } from 'react-router-dom';

interface HistoryViewProps {
  completedJobs: CompletedJob[];
  onClose: () => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  completedJobs,
  onClose,
  onClearHistory,
}) => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<CompletedJob | null>(null);

  // Sort by completion time (most recent first)
  const sortedJobs = [...completedJobs].sort((a, b) => {
    const timeA = (a.completedAt || a.failedAt)?.getTime() || 0;
    const timeB = (b.completedAt || b.failedAt)?.getTime() || 0;
    return timeB - timeA;
  });

  const formatTimeAgo = (date: Date | undefined) => {
    if (!date) return '';
    const now = new Date().getTime();
    const time = new Date(date).getTime();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-4 right-4 w-[400px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Processing History</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {sortedJobs.length} completed job{sortedJobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sortedJobs.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearHistory}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-3 h-3 text-slate-600" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            ✕
          </motion.button>
        </div>
      </div>

      {/* Job List */}
      <div className="max-h-[400px] overflow-y-auto">
        {sortedJobs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[10px] text-slate-500">No completed jobs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedJobs.map((job) => (
              <HistoryJobCard
                key={job.sessionId}
                job={job}
                onViewInStudio={() => {
                  if (job.studioUrl) {
                    navigate(job.studioUrl);
                    onClose();
                  }
                }}
                onViewDetails={() => setSelectedJob(job)}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
        <p className="text-[10px] text-slate-500 text-center">
          Click any job to open in Studio
        </p>
      </div>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <SessionDetailsModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface HistoryJobCardProps {
  job: CompletedJob;
  onViewInStudio: () => void;
  onViewDetails: () => void;
  formatTimeAgo: (date: Date | undefined) => string;
}

const HistoryJobCard: React.FC<HistoryJobCardProps> = ({
  job,
  onViewInStudio,
  onViewDetails,
  formatTimeAgo,
}) => {
  const isSuccess = job.finalStatus === 'completed';
  const isCancelled = job.finalStatus === 'cancelled';

  let StatusIcon = CheckCircle2;
  let statusColor = 'text-slate-600';
  let bgColor = 'bg-slate-50/30';
  let statusText = 'Processing completed successfully';

  if (isCancelled) {
    StatusIcon = Ban;
    statusColor = 'text-orange-600';
    bgColor = 'bg-orange-50/30';
    statusText = 'Processing was cancelled';
  } else if (!isSuccess) {
    StatusIcon = XCircle;
    statusColor = 'text-red-600';
    bgColor = 'bg-red-50/30';
    statusText = 'Processing failed';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative px-4 py-3 hover:bg-slate-50/50 cursor-pointer transition-colors ${bgColor}`}
      onClick={onViewInStudio}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-0.5">
          <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-[11px] font-semibold text-slate-900 truncate">
              {job.serviceName}
            </h4>
            <span className="text-[10px] text-slate-500 whitespace-nowrap">
              {formatTimeAgo(job.completedAt || job.failedAt)}
            </span>
          </div>

          <p className="text-[10px] text-slate-600 mb-1">
            {statusText}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2">
            {isSuccess && job.studioUrl && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewInStudio();
                }}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium text-slate-700 transition-colors"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                Open in Studio
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded text-[10px] font-medium text-slate-600 transition-colors"
            >
              <Info className="w-2.5 h-2.5" />
              View Details
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Session Details Modal
interface SessionDetailsModalProps {
  job: CompletedJob;
  onClose: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ job, onClose }) => {
  const formatDateTime = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    if (!job.startedAt || !job.completedAt) return 'N/A';
    const diff = job.completedAt.getTime() - job.startedAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[10000]"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg shadow-xl z-[10001]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Session Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 max-h-[500px] overflow-y-auto">
          <div className="space-y-3">
            {/* Service Name */}
            <DetailRow label="Service" value={job.serviceName} />

            {/* Status */}
            <DetailRow label="Status" value={job.stageDisplayName} />

            {/* Session ID */}
            <DetailRow
              label="Session ID"
              value={job.sessionId}
              mono
              copyable
            />

            {/* Started At */}
            <DetailRow label="Started" value={formatDateTime(job.startedAt)} />

            {/* Completed At */}
            {job.completedAt && (
              <DetailRow label="Completed" value={formatDateTime(job.completedAt)} />
            )}

            {/* Duration */}
            <DetailRow label="Duration" value={getDuration()} />

            {/* Progress */}
            <DetailRow label="Progress" value={`${job.progress}%`} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, mono, copyable }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-between items-start">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs text-slate-900 text-right max-w-xs truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
