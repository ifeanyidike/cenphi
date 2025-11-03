/**
 * Processing Monitor Context - Global State for Active AI Jobs
 *
 * Manages all active processing jobs across the dashboard.
 * Jobs are synced with backend sessions on page load.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { studioAPI } from '@/services/studioAPI';
import { workspaceHub } from '@/repo/workspace_hub';
import { authStore } from '@/stores/authStore';

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
  completedAt?: Date; // Track when job completed
  failedAt?: Date; // Track when job failed
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
  clearAllJobs: () => void; // Emergency clear all jobs
  forceValidateJobs: () => Promise<void>; // Force backend validation
}

const ProcessingMonitorContext = createContext<ProcessingMonitorContextType | undefined>(undefined);

// No more localStorage - all state is in-memory only
const COMPLETED_JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes - auto-remove completed jobs
const FAILED_JOB_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes - auto-remove failed jobs
const CLEANUP_INTERVAL_MS = 30 * 1000; // 30 seconds - how often to check for cleanup

export const ProcessingMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const sseConnectionsRef = useRef<Map<string, EventSource>>(new Map());

  // Helper function to format service names
  const formatServiceName = useCallback((sessionType: string): string => {
    switch (sessionType) {
      case 'platform_optimization':
        return 'Platform Optimization';
      case 'story_video':
        return 'Story Video';
      case 'clipping':
        return 'Clipping';
      case 'custom_pipeline':
        return 'Custom Pipeline';
      default:
        return sessionType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }, []);

  // Track token retry attempts per session
  const tokenRetryAttemptsRef = useRef<Map<string, number>>(new Map());
  const maxTokenRetries = 3;

  // Subscribe to SSE updates for a session - universal dashboard-level SSE
  const subscribeToSession = useCallback((sessionId: string) => {
    // Check if already connected
    if (sseConnectionsRef.current.has(sessionId)) {
      console.log(`[ProcessingMonitor] 🔌 Already connected to session ${sessionId}`);
      return;
    }

    console.log(`[ProcessingMonitor] 🔌 Subscribing to SSE for session ${sessionId}`);

    const token = authStore.accessToken;
    if (!token) {
      const retryAttempts = tokenRetryAttemptsRef.current.get(sessionId) || 0;

      if (retryAttempts >= maxTokenRetries) {
        console.error(`[ProcessingMonitor] ❌ Max token retries reached for session ${sessionId}`);
        return;
      }

      console.warn(`[ProcessingMonitor] ⚠️ No auth token available for SSE, will retry (${retryAttempts + 1}/${maxTokenRetries})...`);
      tokenRetryAttemptsRef.current.set(sessionId, retryAttempts + 1);

      // Retry after a short delay in case token is still loading
      setTimeout(() => {
        const retryToken = authStore.accessToken;
        if (retryToken) {
          console.log(`[ProcessingMonitor] ✅ Token available on retry, subscribing to ${sessionId}`);
          tokenRetryAttemptsRef.current.delete(sessionId); // Reset retry count on success
          subscribeToSession(sessionId);
        } else {
          subscribeToSession(sessionId); // This will increment retry count
        }
      }, 1000);
      return;
    }

    // Token is available, reset retry count
    tokenRetryAttemptsRef.current.delete(sessionId);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const eventSource = new EventSource(`${apiUrl}/api/v1/studio/sessions/${sessionId}/sse?token=${token}`);

    eventSource.onopen = () => {
      console.log(`[ProcessingMonitor] ✅ SSE connected for session ${sessionId}`);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`[ProcessingMonitor] 📡 SSE update for ${sessionId}:`, data);

        if (data.type === 'stage_update' && data.stage) {
          const stage = data.stage;

          // Update job with stage information
          setActiveJobs(prev => {
            return prev.map(job => {
              if (job.sessionId === sessionId) {
                return {
                  ...job,
                  status: stage.status === 'completed' ? 'completed' :
                          stage.status === 'failed' ? 'failed' : 'processing',
                  progress: stage.progress || 0,
                  currentStage: stage.stage_id || job.currentStage,
                  stageDisplayName: stage.display_name || job.stageDisplayName,
                  previewUrl: stage.message && stage.status === 'completed' ? stage.message : job.previewUrl,
                  hasFailedStage: stage.status === 'failed' || job.hasFailedStage,
                  completedAt: stage.status === 'completed' && stage.progress >= 100 ? new Date() : job.completedAt,
                  failedAt: stage.status === 'failed' ? new Date() : job.failedAt,
                };
              }
              return job;
            });
          });
        } else if (data.type === 'session_complete') {
          console.log(`[ProcessingMonitor] ✅ Session ${sessionId} completed`);
          setActiveJobs(prev => {
            return prev.map(job => {
              if (job.sessionId === sessionId) {
                return {
                  ...job,
                  status: 'completed',
                  progress: 100,
                  completedAt: new Date(),
                };
              }
              return job;
            });
          });

          // Close SSE connection for completed session
          eventSource.close();
          sseConnectionsRef.current.delete(sessionId);
        } else if (data.type === 'session_failed') {
          console.log(`[ProcessingMonitor] ❌ Session ${sessionId} failed`);
          setActiveJobs(prev => {
            return prev.map(job => {
              if (job.sessionId === sessionId) {
                return {
                  ...job,
                  status: 'failed',
                  hasFailedStage: true,
                  failedAt: new Date(),
                };
              }
              return job;
            });
          });
        }
      } catch (error) {
        console.error('[ProcessingMonitor] ❌ Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`[ProcessingMonitor] ❌ SSE error for session ${sessionId}:`, error);
      eventSource.close();
      sseConnectionsRef.current.delete(sessionId);

      // Retry connection after 5 seconds for processing jobs
      setTimeout(() => {
        setActiveJobs(prev => {
          const job = prev.find(j => j.sessionId === sessionId);
          if (job && (job.status === 'processing' || job.status === 'paused')) {
            console.log(`[ProcessingMonitor] 🔄 Retrying SSE connection for ${sessionId}`);
            subscribeToSession(sessionId);
          }
          return prev;
        });
      }, 5000);
    };

    sseConnectionsRef.current.set(sessionId, eventSource);
  }, []);

  // Update job function - must be defined before subscribeToSession uses it
  const updateJob = useCallback((sessionId: string, updates: Partial<ActiveJob>) => {
    setActiveJobs(prev => {
      return prev.map(job => {
        if (job.sessionId === sessionId) {
          const updatedJob = { ...job, ...updates };

          // CRITICAL FIX: Auto-complete jobs that reach 100% progress
          if (updatedJob.progress >= 100 && updatedJob.status === 'processing') {
            console.log(`[ProcessingMonitor] Auto-completing job ${sessionId} at 100% progress`);
            updatedJob.status = 'completed';
            updatedJob.completedAt = new Date();
          }

          // Track completion/failure timestamps for auto-cleanup
          if (updates.status === 'completed' && !job.completedAt) {
            updatedJob.completedAt = new Date();
            console.log(`[ProcessingMonitor] Job ${sessionId} completed at ${updatedJob.completedAt.toISOString()}`);
          }
          if ((updates.status === 'failed' || updates.hasFailedStage) && !job.failedAt) {
            updatedJob.failedAt = new Date();
            console.log(`[ProcessingMonitor] Job ${sessionId} failed at ${updatedJob.failedAt.toISOString()}`);
          }

          return updatedJob;
        }
        return job;
      });
    });
  }, []);

  // Initialize: Fetch active sessions from backend on mount
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second

    const initializeFromBackend = async () => {
      try {
        // Clean up old localStorage data (migration)
        const oldStorageKey = 'cenphi_active_jobs';
        if (localStorage.getItem(oldStorageKey)) {
          console.log('[ProcessingMonitor] Removing old localStorage data');
          localStorage.removeItem(oldStorageKey);
        }

        // Wait for workspace to be ready (with retries)
        let workspace = await workspaceHub.getWorkspaceData();

        while (!workspace?.id && retryCount < maxRetries) {
          retryCount++;
          console.log(`[ProcessingMonitor] ⏳ Workspace not ready, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          workspace = await workspaceHub.getWorkspaceData();
        }

        if (!workspace?.id) {
          console.warn('[ProcessingMonitor] ⚠️ No workspace found after retries, skipping session fetch');
          setIsInitialized(true);
          return;
        }

        console.log('[ProcessingMonitor] ✅ Workspace found:', workspace.id);
        console.log('[ProcessingMonitor] 🔄 Fetching active sessions from backend...');

        // Fetch active sessions for this workspace
        const response = await studioAPI.getActiveSessions({ workspaceId: workspace.id });

        console.log('[ProcessingMonitor] 📡 API Response:', response);

        if (!response.sessions || response.sessions.length === 0) {
          console.log('[ProcessingMonitor] ℹ️ No active sessions found in response');
          setIsInitialized(true);
          return;
        }

        console.log(`[ProcessingMonitor] 📊 Found ${response.sessions.length} total session(s)`);
        console.log('[ProcessingMonitor] 🔍 Session statuses:', response.sessions.map((s: any) => ({ id: s.session_id, status: s.status })));

        // Convert backend sessions to ActiveJob format and subscribe to SSE updates
        const jobs: ActiveJob[] = response.sessions
          .filter(session => {
            const keep = session.status !== 'cancelled' && session.status !== 'completed';
            if (!keep) {
              console.log(`[ProcessingMonitor] ⏭️ Filtering out session ${session.session_id} with status: ${session.status}`);
            }
            return keep;
          })
          .map(session => ({
            sessionId: session.session_id,
            serviceType: session.session_type as any,
            serviceName: formatServiceName(session.session_type),
            status: session.status as any,
            progress: session.status === 'processing' ? 0 : 100, // Will be updated by SSE
            currentStage: 'initializing',
            stageDisplayName: 'Initializing',
            startedAt: new Date(session.created_at),
            studioUrl: `/studio?session=${session.session_id}`,
          }));

        console.log(`[ProcessingMonitor] ✨ After filtering: ${jobs.length} job(s) to display`);

        if (jobs.length > 0) {
          console.log(`[ProcessingMonitor] 🎯 Registering ${jobs.length} active job(s):`, jobs.map(j => ({ id: j.sessionId, service: j.serviceName })));
          setActiveJobs(jobs);

          // Subscribe to SSE for all active jobs - universal dashboard SSE
          jobs.forEach(job => {
            console.log(`[ProcessingMonitor] 🔌 Subscribing to SSE for job ${job.sessionId}`);
            subscribeToSession(job.sessionId);
          });
        } else {
          console.warn('[ProcessingMonitor] ⚠️ No jobs to register after filtering');
        }

      } catch (error) {
        console.error('[ProcessingMonitor] ❌ Failed to initialize from backend:', error);
        if (error instanceof Error) {
          console.error('[ProcessingMonitor] Error details:', error.message, error.stack);
        }
      } finally {
        console.log('[ProcessingMonitor] ✅ Initialization complete');
        setIsInitialized(true);
      }
    };

    initializeFromBackend();
  }, [formatServiceName, subscribeToSession]);

  // Cleanup SSE connections on unmount
  useEffect(() => {
    return () => {
      console.log('[ProcessingMonitor] 🧹 Cleaning up SSE connections');
      sseConnectionsRef.current.forEach((eventSource, sessionId) => {
        eventSource.close();
        console.log(`[ProcessingMonitor] 🔌 Closed SSE connection for ${sessionId}`);
      });
      sseConnectionsRef.current.clear();
    };
  }, []);

  // Periodic cleanup - remove old completed/failed jobs and auto-complete jobs at 100%
  useEffect(() => {
    if (!isInitialized) {
      return; // Wait for backend initialization
    }

    const cleanupInterval = setInterval(async () => {
      const now = new Date().getTime();

      // Filter out expired jobs and auto-complete jobs at 100%
      setActiveJobs(prev => {
        const processed = prev
          .filter(job => {
            // Remove completed jobs older than 5 minutes
            if (job.status === 'completed' && job.completedAt) {
              const age = now - new Date(job.completedAt).getTime();
              if (age >= COMPLETED_JOB_TIMEOUT_MS) {
                console.log(`[ProcessingMonitor] Auto-removing completed job ${job.sessionId} (${Math.round(age / 60000)} minutes old)`);
                return false;
              }
            }

            // Remove failed jobs older than 15 minutes
            if ((job.status === 'failed' || job.hasFailedStage) && job.failedAt) {
              const age = now - new Date(job.failedAt).getTime();
              if (age >= FAILED_JOB_TIMEOUT_MS) {
                console.log(`[ProcessingMonitor] Auto-removing failed job ${job.sessionId} (${Math.round(age / 60000)} minutes old)`);
                return false;
              }
            }

            return true;
          })
          .map(job => {
            // Auto-complete jobs at 100% progress that are still marked as "processing"
            if (job.status === 'processing' && job.progress >= 100) {
              console.log(`[ProcessingMonitor] Cleanup: Auto-completing job ${job.sessionId} at 100% progress`);
              return {
                ...job,
                status: 'completed' as const,
                completedAt: new Date()
              };
            }
            return job;
          });

        return processed.length !== prev.length || processed.some((job, i) => job !== prev[i])
          ? processed
          : prev;
      });

      // Validate processing/paused jobs against backend (every 2 minutes)
      // This catches jobs that were cancelled/completed on the server but not updated locally
      const shouldValidate = Math.floor(now / 1000) % 120 === 0; // Every 2 minutes
      if (shouldValidate) {
        setActiveJobs(prev => {
          const processingJobs = prev.filter(job =>
            job.status === 'processing' || job.status === 'paused'
          );

          if (processingJobs.length === 0) {
            return prev;
          }

          console.log(`[ProcessingMonitor] Validating ${processingJobs.length} processing jobs against backend`);

          // Run validation asynchronously and update state when complete
          Promise.all(
            processingJobs.map(async (job) => {
              try {
                const sessionStatus = await studioAPI.checkSessionStatus(job.sessionId);

                // If session doesn't exist or is cancelled, remove it
                if (!sessionStatus || sessionStatus.status === 'cancelled') {
                  console.log(`[ProcessingMonitor] Removing invalid/cancelled job ${job.sessionId}`);
                  return { sessionId: job.sessionId, shouldRemove: true };
                }

                // If backend says completed but we still have it as processing, update it
                if (sessionStatus.status === 'completed' && job.status !== 'completed') {
                  console.log(`[ProcessingMonitor] Updating job ${job.sessionId} to completed (backend sync)`);
                  return { sessionId: job.sessionId, shouldRemove: false, update: { status: 'completed' as const, completedAt: new Date() } };
                }

                return { sessionId: job.sessionId, shouldRemove: false };
              } catch (error) {
                console.error(`[ProcessingMonitor] Failed to validate job ${job.sessionId}:`, error);
                return { sessionId: job.sessionId, shouldRemove: false };
              }
            })
          ).then((validationResults) => {
            const jobsToRemove = validationResults
              .filter(r => r.shouldRemove)
              .map(r => r.sessionId);

            const jobsToUpdate = validationResults
              .filter(r => r.update)
              .reduce((acc, r) => {
                acc[r.sessionId] = r.update;
                return acc;
              }, {} as Record<string, any>);

            if (jobsToRemove.length > 0 || Object.keys(jobsToUpdate).length > 0) {
              setActiveJobs(currentJobs => {
                return currentJobs
                  .filter(job => !jobsToRemove.includes(job.sessionId))
                  .map(job => jobsToUpdate[job.sessionId] ? { ...job, ...jobsToUpdate[job.sessionId] } : job);
              });
            }
          }).catch((error) => {
            console.error('[ProcessingMonitor] Validation failed:', error);
          });

          return prev;
        });
      }
    }, CLEANUP_INTERVAL_MS);

    return () => clearInterval(cleanupInterval);
  }, [isInitialized]);

  const registerJob = useCallback((job: ActiveJob) => {
    setActiveJobs(prev => {
      // Check if job already exists
      const exists = prev.find(j => j.sessionId === job.sessionId);
      if (exists) {
        return prev;
      }

      // Subscribe to SSE for this new job
      subscribeToSession(job.sessionId);

      return [...prev, job];
    });
  }, [subscribeToSession]);

  const removeJob = useCallback((sessionId: string) => {
    // Close SSE connection for this job
    const eventSource = sseConnectionsRef.current.get(sessionId);
    if (eventSource) {
      eventSource.close();
      sseConnectionsRef.current.delete(sessionId);
      console.log(`[ProcessingMonitor] Closed SSE connection for removed job ${sessionId}`);
    }

    setActiveJobs(prev => prev.filter(j => j.sessionId !== sessionId));
  }, []);

  const getJob = useCallback((sessionId: string) => {
    return activeJobs.find(j => j.sessionId === sessionId);
  }, [activeJobs]);

  const clearAllJobs = useCallback(() => {
    console.log('[ProcessingMonitor] Clearing all jobs (manual clear)');

    // Close all SSE connections
    sseConnectionsRef.current.forEach((eventSource, sessionId) => {
      eventSource.close();
      console.log(`[ProcessingMonitor] Closed SSE connection for job ${sessionId}`);
    });
    sseConnectionsRef.current.clear();

    setActiveJobs([]);
  }, []);

  const forceValidateJobs = useCallback(async () => {
    console.log('[ProcessingMonitor] Force validating all jobs');

    const processingJobs = activeJobs.filter(job =>
      job.status === 'processing' || job.status === 'paused'
    );

    if (processingJobs.length === 0) {
      return;
    }

    try {
      const validationResults = await Promise.all(
        processingJobs.map(async (job) => {
          try {
            const sessionStatus = await studioAPI.checkSessionStatus(job.sessionId);

            if (!sessionStatus || sessionStatus.status === 'cancelled') {
              return { sessionId: job.sessionId, shouldRemove: true };
            }

            if (sessionStatus.status === 'completed' && job.status !== 'completed') {
              return { sessionId: job.sessionId, shouldRemove: false, update: { status: 'completed' as const, completedAt: new Date() } };
            }

            return { sessionId: job.sessionId, shouldRemove: false };
          } catch (error) {
            console.error(`[ProcessingMonitor] Failed to validate job ${job.sessionId}:`, error);
            return { sessionId: job.sessionId, shouldRemove: false };
          }
        })
      );

      const jobsToRemove = validationResults
        .filter(r => r.shouldRemove)
        .map(r => r.sessionId);

      const jobsToUpdate = validationResults
        .filter(r => r.update)
        .reduce((acc, r) => {
          acc[r.sessionId] = r.update!;
          return acc;
        }, {} as Record<string, Partial<ActiveJob>>);

      if (jobsToRemove.length > 0 || Object.keys(jobsToUpdate).length > 0) {
        setActiveJobs(currentJobs => {
          return currentJobs
            .filter(job => !jobsToRemove.includes(job.sessionId))
            .map(job => jobsToUpdate[job.sessionId] ? { ...job, ...jobsToUpdate[job.sessionId] } : job);
        });
      }
    } catch (error) {
      console.error('[ProcessingMonitor] Force validation failed:', error);
    }
  }, [activeJobs]);

  const value: ProcessingMonitorContextType = {
    activeJobs,
    registerJob,
    updateJob,
    removeJob,
    getJob,
    clearAllJobs,
    forceValidateJobs,
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
