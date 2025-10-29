/**
 * Processing Monitor Context - Global State for Active AI Jobs
 *
 * Manages all active processing jobs across the dashboard.
 * Jobs persist in localStorage to survive page refreshes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { studioAPI } from '@/services/studioAPI';

export interface ActiveJob {
  sessionId: string;
  testimonialId?: string;
  testimonialIds?: string[];
  serviceType: 'platform_optimization' | 'story_video' | 'clipping' | 'enhancement' | 'custom_pipeline';
  serviceName: string;
  status: 'processing' | 'paused' | 'failed' | 'completed' | 'cancelled';
  progress: number; // 0-100
  currentStage: string;
  stageDisplayName: string;
  startedAt: Date;
  previewUrl?: string;
  studioUrl: string;
  hasFailedStage?: boolean; // Track if any stage has failed
}

interface ProcessingMonitorContextType {
  activeJobs: ActiveJob[];
  registerJob: (job: ActiveJob) => void;
  updateJob: (sessionId: string, updates: Partial<ActiveJob>) => void;
  removeJob: (sessionId: string) => void;
  getJob: (sessionId: string) => ActiveJob | undefined;
}

const ProcessingMonitorContext = createContext<ProcessingMonitorContextType | undefined>(undefined);

const STORAGE_KEY = 'cenphi_active_jobs';
const MAX_JOB_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours
const ACTIVE_JOB_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours - sessions timeout after this

export const ProcessingMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load jobs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as ActiveJob[];

        // Filter out stale jobs (older than 48 hours) AND cancelled sessions
        // ALSO filter out old processing/paused jobs (older than 2 hours) - they've likely expired
        const now = new Date().getTime();
        const fresh = parsed.filter(job => {
          const jobAge = now - new Date(job.startedAt).getTime();
          const isStale = jobAge >= MAX_JOB_AGE_MS;
          const isCancelled = job.status === 'cancelled';

          // Auto-expire old processing/paused jobs (sessions timeout after 2 hours of inactivity)
          const isExpiredActive = (job.status === 'processing' || job.status === 'paused') && jobAge >= ACTIVE_JOB_TIMEOUT_MS;

          return !isStale && !isCancelled && !isExpiredActive;
        });

        // Convert date strings back to Date objects
        const restored = fresh.map(job => ({
          ...job,
          startedAt: new Date(job.startedAt),
        }));

        setActiveJobs(restored);

        // If we filtered any jobs, update localStorage
        if (fresh.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        }

        // Validate jobs against backend to ensure they still exist
        // Only check non-completed, non-failed jobs (processing/paused)
        const jobsToValidate = restored.filter(
          job => job.status === 'processing' || job.status === 'paused'
        );

        if (jobsToValidate.length > 0) {
          // Validate each job in parallel
          Promise.all(
            jobsToValidate.map(async (job) => {
              const sessionStatus = await studioAPI.checkSessionStatus(job.sessionId);

              if (!sessionStatus || sessionStatus.status === 'cancelled') {
                return job.sessionId; // Mark for removal
              }

              return null; // Keep the job
            })
          ).then((results) => {
            const jobsToRemove = results.filter(Boolean) as string[];

            if (jobsToRemove.length > 0) {
              setActiveJobs(prev => {
                const updated = prev.filter(job => !jobsToRemove.includes(job.sessionId));
                // Update localStorage immediately
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });
            }
          }).catch((error) => {
            console.error('[ProcessingMonitor] Failed to validate jobs:', error);
            // Don't fail silently - continue with existing jobs
          });
        }
      }
    } catch (error) {
      console.error('[ProcessingMonitor] Failed to load jobs from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
    }

    // Mark as initialized so persist effect can start working
    setIsInitialized(true);
  }, []);

  // Persist jobs to localStorage whenever they change (but only after initialization)
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeJobs));
    } catch (error) {
      console.error('[ProcessingMonitor] Failed to save jobs to localStorage:', error);
    }
  }, [activeJobs, isInitialized]);

  const registerJob = useCallback((job: ActiveJob) => {
    setActiveJobs(prev => {
      // Check if job already exists
      const exists = prev.find(j => j.sessionId === job.sessionId);
      if (exists) {
        return prev;
      }

      return [...prev, job];
    });
  }, []);

  const updateJob = useCallback((sessionId: string, updates: Partial<ActiveJob>) => {
    setActiveJobs(prev => {
      return prev.map(job => {
        if (job.sessionId === sessionId) {
          return { ...job, ...updates };
        }
        return job;
      });
    });
  }, []);

  const removeJob = useCallback((sessionId: string) => {
    setActiveJobs(prev => prev.filter(j => j.sessionId !== sessionId));
  }, []);

  const getJob = useCallback((sessionId: string) => {
    return activeJobs.find(j => j.sessionId === sessionId);
  }, [activeJobs]);

  const value: ProcessingMonitorContextType = {
    activeJobs,
    registerJob,
    updateJob,
    removeJob,
    getJob,
  };

  return (
    <ProcessingMonitorContext.Provider value={value}>
      {children}
    </ProcessingMonitorContext.Provider>
  );
};

export const useProcessingMonitor = () => {
  const context = useContext(ProcessingMonitorContext);
  if (!context) {
    throw new Error('useProcessingMonitor must be used within ProcessingMonitorProvider');
  }
  return context;
};
