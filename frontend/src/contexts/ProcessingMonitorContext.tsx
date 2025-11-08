/**
 * Processing Monitor Context - Global State for Active AI Jobs
 *
 * Manages all active processing jobs across the dashboard.
 * Jobs are synced with backend sessions on page load.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { observer } from "mobx-react-lite";
import { studioAPI } from "@/services/studioAPI";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";

export interface ActiveJob {
  sessionId: string;
  testimonialId?: string;
  testimonialIds?: string[];
  serviceType:
    | "platform_optimization"
    | "story_video"
    | "clipping"
    | "custom_pipeline";
  serviceName: string;
  status: "processing" | "paused" | "failed" | "completed" | "cancelled";
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

// Extended interface for completed/failed jobs in history
export interface CompletedJob extends ActiveJob {
  contentHubUrl?: string; // Link to Content Hub for this session's output
  finalStatus: "completed" | "failed" | "cancelled"; // Final outcome status
}

interface ProcessingMonitorContextType {
  activeJobs: ActiveJob[];
  completedJobs: CompletedJob[]; // History of completed/failed jobs
  registerJob: (job: ActiveJob) => void;
  updateJob: (sessionId: string, updates: Partial<ActiveJob>) => void;
  removeJob: (sessionId: string) => void;
  getJob: (sessionId: string) => ActiveJob | undefined;
  clearAllJobs: () => void; // Emergency clear all jobs
  clearHistory: () => void; // Clear completed jobs history
  forceValidateJobs: () => Promise<void>; // Force backend validation
}

const ProcessingMonitorContext = createContext<
  ProcessingMonitorContextType | undefined
>(undefined);

// History settings - backend-based persistence
const COMPLETED_JOB_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour - keep completed jobs visible for user to save
const FAILED_JOB_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes - move to history
const CLEANUP_INTERVAL_MS = 30 * 1000; // 30 seconds - how often to check for cleanup

export const ProcessingMonitorProvider: React.FC<{
  children: React.ReactNode;
}> = observer(({ children }) => {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const sseConnectionsRef = useRef<Map<string, EventSource>>(new Map());

  // Helper function to format service names
  const formatServiceName = useCallback((sessionType: string): string => {
    switch (sessionType) {
      case "platform_optimization":
        return "Platform Optimization";
      case "story_video":
        return "Story Video";
      case "clipping":
        return "Clipping";
      case "custom_pipeline":
        return "Custom Pipeline";
      default:
        return sessionType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
    }
  }, []);

  // Helper function to generate display name from stage ID
  const formatStageDisplayName = useCallback((stageId: string, status?: string): string => {
    // If status is provided and matches common values, use those
    if (status === "completed") return "Completed";
    if (status === "failed") return "Failed";
    if (status === "cancelled") return "Cancelled";
    if (status === "paused") return "Paused";

    // Map common stage IDs to display names
    const stageDisplayNames: Record<string, string> = {
      // Testimonial processing stages
      transcription: "Transcription",
      sentiment_analysis: "Sentiment Analysis",
      highlight_extraction: "Key Moments",
      enhancement: "Video Enhancement",
      noise_removal: "Audio Cleanup",

      // Platform optimization stages
      platform_optimization: "Platform Optimization",
      story_video: "Story Video Generation",
      clipping: "Clipping",

      // Custom pipeline stages
      crop_resize: "Crop & Resize",
      burn_captions: "Burn Captions",
      text_overlay: "Text Overlay",
      background_removal: "Background Removal",
      color_grading: "Color Grading",
      audio_enhancement: "Audio Enhancement",
    };

    // If we have a mapping, use it
    if (stageDisplayNames[stageId]) {
      return stageDisplayNames[stageId];
    }

    // Otherwise, format the stage ID into a readable name
    return stageId
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, []);

  // Helper function to generate studio URL from session data
  const getStudioUrl = useCallback((session: any): string => {
    const sessionType = session.session_type;
    const testimonialId = session.testimonial_id;
    const clipId = session.clip_id;
    const sessionId = session.session_id;

    // Build URL with both testimonialId and sessionId parameters
    // sessionId allows studio to load specific completed sessions
    if (testimonialId) {
      const studioUrlMap: Record<string, string> = {
        platform_optimization: `/studio/optimize?testimonialId=${testimonialId}&sessionId=${sessionId}`,
        story_video: `/studio/story?testimonialId=${testimonialId}&sessionId=${sessionId}`,
        clipping: `/studio/clipping?testimonialId=${testimonialId}${clipId ? `&clipId=${clipId}` : ''}&sessionId=${sessionId}`,
        custom_pipeline: `/studio/custom?testimonialId=${testimonialId}&sessionId=${sessionId}`,
      };
      return studioUrlMap[sessionType] || `/studio?testimonialId=${testimonialId}&sessionId=${sessionId}`;
    }

    // Fallback to session ID if no testimonialId (shouldn't happen for typical workflows)
    return `/studio?sessionId=${sessionId}`;
  }, []);

  // Helper function to move jobs to history (in-memory only, backend is source of truth)
  const moveJobToHistory = useCallback((job: ActiveJob) => {
    const completedJob: CompletedJob = {
      ...job,
      finalStatus:
        job.status === "failed" || job.hasFailedStage ? "failed" : "completed",
      contentHubUrl: `/content-hub?session=${job.sessionId}`,
    };

    setCompletedJobs((prev) => {
      // Check if already in history
      if (prev.some((j) => j.sessionId === job.sessionId)) {
        return prev;
      }
      return [...prev, completedJob];
    });

    console.log(
      `[ProcessingMonitor] Moved job ${job.sessionId} to history with status: ${completedJob.finalStatus}`
    );
  }, []);

  // Track token retry attempts per session
  const tokenRetryAttemptsRef = useRef<Map<string, number>>(new Map());
  const maxTokenRetries = 3;

  // Subscribe to SSE updates for a session - universal dashboard-level SSE
  const subscribeToSession = useCallback(async (sessionId: string) => {
    // Check if already connected
    if (sseConnectionsRef.current.has(sessionId)) {
      console.log(
        `[ProcessingMonitor] 🔌 Already connected to session ${sessionId}`
      );
      return;
    }

    console.log(
      `[ProcessingMonitor] 🔌 Subscribing to SSE for session ${sessionId}`
    );

    let token: string | undefined;
    try {
      token = await authStore.user?.getIdToken();
    } catch (error) {
      console.error(`[ProcessingMonitor] ❌ Failed to get token:`, error);
    }

    if (!token) {
      const retryAttempts = tokenRetryAttemptsRef.current.get(sessionId) || 0;

      if (retryAttempts >= maxTokenRetries) {
        console.error(
          `[ProcessingMonitor] ❌ Max token retries reached for session ${sessionId}`
        );
        return;
      }

      console.warn(
        `[ProcessingMonitor] ⚠️ No auth token available for SSE, will retry (${retryAttempts + 1}/${maxTokenRetries})...`
      );
      tokenRetryAttemptsRef.current.set(sessionId, retryAttempts + 1);

      // Retry after a short delay in case token is still loading
      setTimeout(async () => {
        let retryToken: string | undefined;
        try {
          retryToken = await authStore.user?.getIdToken();
        } catch (error) {
          console.error(
            `[ProcessingMonitor] ❌ Failed to get retry token:`,
            error
          );
        }

        if (retryToken) {
          console.log(
            `[ProcessingMonitor] ✅ Token available on retry, subscribing to ${sessionId}`
          );
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

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
    const eventSource = new EventSource(
      `${apiUrl}/studio/sessions/${sessionId}/stream?token=${encodeURIComponent(token)}`
    );

    eventSource.onopen = () => {
      console.log(
        `[ProcessingMonitor] ✅ SSE connected for session ${sessionId}`
      );
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(
          `[ProcessingMonitor] 📡 SSE update for ${sessionId}:`,
          data
        );

        if (data.type === "stage_update" && data.stage) {
          const stage = data.stage;

          // Update job with stage information
          setActiveJobs((prev) => {
            return prev.map((job) => {
              if (job.sessionId === sessionId) {
                const newStageId = stage.stage_id || job.currentStage;
                // Use display_name if provided, otherwise generate from stage_id
                const newDisplayName = stage.display_name ||
                  formatStageDisplayName(newStageId, stage.status);

                // CRITICAL FIX: Don't mark job as "completed" when a stage completes
                // Only mark as "completed" when session_complete event is received
                // A stage completing doesn't mean the entire job is done
                let newStatus = job.status;
                if (stage.status === "failed") {
                  newStatus = "failed";
                } else if (stage.status === "paused") {
                  newStatus = "paused";
                } else if (stage.status === "processing" || stage.status === "in_progress") {
                  newStatus = "processing";
                }
                // Keep current status if stage is "completed" - wait for session_complete

                return {
                  ...job,
                  status: newStatus,
                  progress: stage.progress || job.progress,
                  currentStage: newStageId,
                  stageDisplayName: newDisplayName,
                  previewUrl:
                    stage.message && stage.status === "completed"
                      ? stage.message
                      : job.previewUrl,
                  hasFailedStage:
                    stage.status === "failed" || job.hasFailedStage,
                  failedAt:
                    stage.status === "failed" ? new Date() : job.failedAt,
                  // Don't set completedAt here - only when session_complete is received
                };
              }
              return job;
            });
          });
        } else if (data.type === "session_complete") {
          console.log(`[ProcessingMonitor] ✅ Session ${sessionId} completed`);
          setActiveJobs((prev) => {
            return prev.map((job) => {
              if (job.sessionId === sessionId) {
                return {
                  ...job,
                  status: "completed",
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
        } else if (data.type === "session_failed") {
          console.log(`[ProcessingMonitor] ❌ Session ${sessionId} failed`);
          setActiveJobs((prev) => {
            return prev.map((job) => {
              if (job.sessionId === sessionId) {
                return {
                  ...job,
                  status: "failed",
                  hasFailedStage: true,
                  failedAt: new Date(),
                };
              }
              return job;
            });
          });
        }
      } catch (error) {
        console.error(
          "[ProcessingMonitor] ❌ Failed to parse SSE message:",
          error
        );
      }
    };

    eventSource.onerror = (error) => {
      console.error(
        `[ProcessingMonitor] ❌ SSE error for session ${sessionId}:`,
        error
      );
      eventSource.close();
      sseConnectionsRef.current.delete(sessionId);

      // Retry connection after 5 seconds for processing jobs
      setTimeout(() => {
        setActiveJobs((prev) => {
          const job = prev.find((j) => j.sessionId === sessionId);
          if (job && (job.status === "processing" || job.status === "paused")) {
            console.log(
              `[ProcessingMonitor] 🔄 Retrying SSE connection for ${sessionId}`
            );
            subscribeToSession(sessionId);
          }
          return prev;
        });
      }, 5000);
    };

    sseConnectionsRef.current.set(sessionId, eventSource);
  }, [formatStageDisplayName]);

  // Update job function - must be defined before subscribeToSession uses it
  const updateJob = useCallback(
    (sessionId: string, updates: Partial<ActiveJob>) => {
      setActiveJobs((prev) => {
        return prev.map((job) => {
          if (job.sessionId === sessionId) {
            const updatedJob = { ...job, ...updates };

            // CRITICAL FIX: Auto-complete jobs that reach 100% progress
            if (
              updatedJob.progress >= 100 &&
              updatedJob.status === "processing"
            ) {
              console.log(
                `[ProcessingMonitor] Auto-completing job ${sessionId} at 100% progress`
              );
              updatedJob.status = "completed";
              updatedJob.completedAt = new Date();
            }

            // Track completion/failure timestamps for auto-cleanup
            if (updates.status === "completed" && !job.completedAt) {
              updatedJob.completedAt = new Date();
              console.log(
                `[ProcessingMonitor] Job ${sessionId} completed at ${updatedJob.completedAt.toISOString()}`
              );
            }
            if (
              (updates.status === "failed" || updates.hasFailedStage) &&
              !job.failedAt
            ) {
              updatedJob.failedAt = new Date();
              console.log(
                `[ProcessingMonitor] Job ${sessionId} failed at ${updatedJob.failedAt.toISOString()}`
              );
            }

            return updatedJob;
          }
          return job;
        });
      });
    },
    []
  );

  // Initialize: Fetch active sessions from backend on mount
  useEffect(() => {
    const initializeFromBackend = async () => {
      try {
        // Wait for workspace to be available
        if (!workspaceHub.workspace?.id) {
          return;
        }
        console.log(
          "[ProcessingMonitor] 🌐 Initializing for workspace:",
          workspaceHub.workspace.id,
          isInitialized
        );

        // Prevent duplicate initialization
        if (isInitialized) {
          return;
        }

        console.log("[ProcessingMonitor] 🔄 Initializing from backend...");

        // Fetch completed sessions from backend for history
        try {
          const completedResponse = await studioAPI.getCompletedSessions(
            workspaceHub.workspace.id
          );

          if (
            completedResponse.sessions &&
            completedResponse.sessions.length > 0
          ) {
            const completedJobsFromBackend: CompletedJob[] =
              completedResponse.sessions.map((session) => {
                // Determine final status
                let finalStatus: "completed" | "failed" | "cancelled" =
                  "completed";

                if (session.status === "failed") {
                  finalStatus = "failed";
                } else if (session.status === "cancelled") {
                  finalStatus = "cancelled";
                } else if (session.status === "completed") {
                  finalStatus = "completed";
                }

                // Use current_stage_id if available, otherwise use session status
                const currentStage = session.current_stage_id || session.status;
                // Generate display name from stage ID and status
                const stageDisplayName = formatStageDisplayName(currentStage, session.status);

                return {
                  sessionId: session.session_id,
                  serviceType: session.session_type as any,
                  serviceName: formatServiceName(session.session_type),
                  status: session.status as any,
                  progress: 100,
                  currentStage,
                  stageDisplayName,
                  startedAt: new Date(session.started_at),
                  completedAt: session.completed_at
                    ? new Date(session.completed_at)
                    : undefined,
                  finalStatus,
                  contentHubUrl: `/content-hub?session=${session.session_id}`,
                  studioUrl: getStudioUrl(session),
                } as any;
              });

            setCompletedJobs(completedJobsFromBackend);
            console.log(
              `[ProcessingMonitor] 📜 Loaded ${completedJobsFromBackend.length} completed sessions from backend`
            );
          }
        } catch (error) {
          console.error(
            "[ProcessingMonitor] ❌ Failed to fetch completed sessions:",
            error
          );
          // Continue with active sessions fetch even if completed sessions fail
        }

        // Fetch active sessions for this workspace
        const response = await studioAPI.getActiveSessions({
          workspaceId: workspaceHub.workspace.id,
        });

        console.log("[ProcessingMonitor] 📡 API Response:", response);

        if (!response.sessions || response.sessions.length === 0) {
          console.log(
            "[ProcessingMonitor] ℹ️ No active sessions found in response"
          );
          setIsInitialized(true);
          return;
        }

        console.log(
          `[ProcessingMonitor] 📊 Found ${response.sessions.length} total session(s)`
        );
        console.log(
          "[ProcessingMonitor] 🔍 Session statuses:",
          response.sessions.map((s: any) => ({
            id: s.session_id,
            status: s.status,
          }))
        );

        // Convert backend sessions to ActiveJob format and subscribe to SSE updates
        const jobs: ActiveJob[] = response.sessions
          .filter((session) => {
            const keep =
              session.status !== "cancelled" && session.status !== "completed";
            if (!keep) {
              console.log(
                `[ProcessingMonitor] ⏭️ Filtering out session ${session.session_id} with status: ${session.status}`
              );
            }
            return keep;
          })
          .map((session) => {
            // Use current_stage_id if available, otherwise use session status
            const currentStage = session.current_stage_id || session.status;
            // Generate display name from stage ID and status
            const stageDisplayName = formatStageDisplayName(currentStage, session.status);

            return {
              sessionId: session.session_id,
              testimonialId: session.testimonial_id,
              serviceType: session.session_type as any,
              serviceName: formatServiceName(session.session_type),
              status: session.status as any,
              progress: session.status === "processing" ? 0 : 100,
              currentStage,
              stageDisplayName,
              startedAt: new Date(session.created_at),
              studioUrl: getStudioUrl(session),
            };
          });

        console.log(
          `[ProcessingMonitor] ✨ After filtering: ${jobs.length} job(s) to display`
        );

        if (jobs.length > 0) {
          console.log(
            `[ProcessingMonitor] 🎯 Registering ${jobs.length} active job(s):`,
            jobs.map((j) => ({ id: j.sessionId, service: j.serviceName }))
          );
          setActiveJobs(jobs);

          // Subscribe to SSE for all active jobs - universal dashboard SSE
          jobs.forEach((job) => {
            console.log(
              `[ProcessingMonitor] 🔌 Subscribing to SSE for job ${job.sessionId}`
            );
            subscribeToSession(job.sessionId);
          });
        } else {
          console.warn(
            "[ProcessingMonitor] ⚠️ No jobs to register after filtering"
          );
        }
        console.log("[ProcessingMonitor] ✅ Initialization complete");
        setIsInitialized(true);
      } catch (error) {
        console.error(
          "[ProcessingMonitor] ❌ Failed to initialize from backend:",
          error
        );
        if (error instanceof Error) {
          console.error(
            "[ProcessingMonitor] Error details:",
            error.message,
            error.stack
          );
        }
      }
    };

    initializeFromBackend();
  }, [formatServiceName, formatStageDisplayName, getStudioUrl, subscribeToSession, workspaceHub.workspace?.id]);

  // Cleanup SSE connections on unmount
  useEffect(() => {
    return () => {
      console.log("[ProcessingMonitor] 🧹 Cleaning up SSE connections");
      sseConnectionsRef.current.forEach((eventSource, sessionId) => {
        eventSource.close();
        console.log(
          `[ProcessingMonitor] 🔌 Closed SSE connection for ${sessionId}`
        );
      });
      sseConnectionsRef.current.clear();
    };
  }, []);

  // Periodic cleanup - remove old completed/failed jobs and auto-complete jobs at 100%
  useEffect(() => {
    console.log("isInitialized", isInitialized);
    if (!isInitialized) {
      return; // Wait for backend initialization
    }

    const cleanupInterval = setInterval(async () => {
      const now = new Date().getTime();
      console.log("[ProcessingMonitor] 🧹 Running periodic cleanup...");

      // Move expired jobs to history and auto-complete jobs at 100%
      setActiveJobs((prev) => {
        const jobsToMove: ActiveJob[] = [];
        const processed = prev
          .filter((job) => {
            // Move completed jobs older than 5 minutes to history
            if (job.status === "completed" && job.completedAt) {
              const age = now - new Date(job.completedAt).getTime();
              if (age >= COMPLETED_JOB_TIMEOUT_MS) {
                console.log(
                  `[ProcessingMonitor] Moving completed job ${job.sessionId} to history (${Math.round(age / 60000)} minutes old)`
                );
                jobsToMove.push(job);
                return false;
              }
            }

            // Move failed jobs older than 15 minutes to history
            if (
              (job.status === "failed" || job.hasFailedStage) &&
              job.failedAt
            ) {
              const age = now - new Date(job.failedAt).getTime();
              if (age >= FAILED_JOB_TIMEOUT_MS) {
                console.log(
                  `[ProcessingMonitor] Moving failed job ${job.sessionId} to history (${Math.round(age / 60000)} minutes old)`
                );
                jobsToMove.push(job);
                return false;
              }
            }

            return true;
          })
          .map((job) => {
            // Auto-complete jobs at 100% progress that are still marked as "processing"
            if (job.status === "processing" && job.progress >= 100) {
              console.log(
                `[ProcessingMonitor] Cleanup: Auto-completing job ${job.sessionId} at 100% progress`
              );
              return {
                ...job,
                status: "completed" as const,
                completedAt: new Date(),
              };
            }
            return job;
          });

        // Move expired jobs to history
        if (jobsToMove.length > 0) {
          jobsToMove.forEach(moveJobToHistory);
        }

        return processed.length !== prev.length ||
          processed.some((job, i) => job !== prev[i])
          ? processed
          : prev;
      });

      // Validate processing/paused jobs against backend (every 2 minutes)
      // This catches jobs that were cancelled/completed on the server but not updated locally
      const shouldValidate = Math.floor(now / 1000) % 120 === 0; // Every 2 minutes
      if (shouldValidate) {
        setActiveJobs((prev) => {
          const processingJobs = prev.filter(
            (job) => job.status === "processing" || job.status === "paused"
          );

          if (processingJobs.length === 0) {
            return prev;
          }

          console.log(
            `[ProcessingMonitor] Validating ${processingJobs.length} processing jobs against backend`
          );

          // Run validation asynchronously and update state when complete
          Promise.all(
            processingJobs.map(async (job) => {
              try {
                const sessionStatus = await studioAPI.checkSessionStatus(
                  job.sessionId
                );

                // If session doesn't exist or is cancelled, remove it
                if (!sessionStatus || sessionStatus.status === "cancelled") {
                  console.log(
                    `[ProcessingMonitor] Removing invalid/cancelled job ${job.sessionId}`
                  );
                  return { sessionId: job.sessionId, shouldRemove: true };
                }

                // If backend says completed but we still have it as processing, update it
                if (
                  sessionStatus.status === "completed" &&
                  job.status !== "completed"
                ) {
                  console.log(
                    `[ProcessingMonitor] Updating job ${job.sessionId} to completed (backend sync)`
                  );
                  return {
                    sessionId: job.sessionId,
                    shouldRemove: false,
                    update: {
                      status: "completed" as const,
                      completedAt: new Date(),
                    },
                  };
                }

                return { sessionId: job.sessionId, shouldRemove: false };
              } catch (error) {
                console.error(
                  `[ProcessingMonitor] Failed to validate job ${job.sessionId}:`,
                  error
                );
                return { sessionId: job.sessionId, shouldRemove: false };
              }
            })
          )
            .then((validationResults) => {
              const jobsToRemove = validationResults
                .filter((r) => r.shouldRemove)
                .map((r) => r.sessionId);

              const jobsToUpdate = validationResults
                .filter((r) => r.update)
                .reduce(
                  (acc, r) => {
                    acc[r.sessionId] = r.update;
                    return acc;
                  },
                  {} as Record<string, any>
                );

              if (
                jobsToRemove.length > 0 ||
                Object.keys(jobsToUpdate).length > 0
              ) {
                setActiveJobs((currentJobs) => {
                  return currentJobs
                    .filter((job) => !jobsToRemove.includes(job.sessionId))
                    .map((job) =>
                      jobsToUpdate[job.sessionId]
                        ? { ...job, ...jobsToUpdate[job.sessionId] }
                        : job
                    );
                });
              }
            })
            .catch((error) => {
              console.error("[ProcessingMonitor] Validation failed:", error);
            });

          return prev;
        });
      }
    }, CLEANUP_INTERVAL_MS);

    return () => clearInterval(cleanupInterval);
  }, [isInitialized]);

  const registerJob = useCallback(
    (job: ActiveJob) => {
      setActiveJobs((prev) => {
        // Check if job already exists
        const exists = prev.find((j) => j.sessionId === job.sessionId);
        if (exists) {
          return prev;
        }

        // Subscribe to SSE for this new job
        subscribeToSession(job.sessionId);

        return [...prev, job];
      });
    },
    [subscribeToSession]
  );

  const removeJob = useCallback((sessionId: string) => {
    // Close SSE connection for this job
    const eventSource = sseConnectionsRef.current.get(sessionId);
    if (eventSource) {
      eventSource.close();
      sseConnectionsRef.current.delete(sessionId);
      console.log(
        `[ProcessingMonitor] Closed SSE connection for removed job ${sessionId}`
      );
    }

    setActiveJobs((prev) => prev.filter((j) => j.sessionId !== sessionId));
  }, []);

  const getJob = useCallback(
    (sessionId: string) => {
      return activeJobs.find((j) => j.sessionId === sessionId);
    },
    [activeJobs]
  );

  const clearAllJobs = useCallback(() => {
    console.log("[ProcessingMonitor] Clearing all jobs (manual clear)");

    // Close all SSE connections
    sseConnectionsRef.current.forEach((eventSource, sessionId) => {
      eventSource.close();
      console.log(
        `[ProcessingMonitor] Closed SSE connection for job ${sessionId}`
      );
    });
    sseConnectionsRef.current.clear();

    setActiveJobs([]);
  }, []);

  const clearHistory = useCallback(() => {
    console.log(
      "[ProcessingMonitor] Clearing completed jobs history (in-memory only)"
    );
    setCompletedJobs([]);
    // Note: History is now fetched from backend on each page load
    // No localStorage cleanup needed
  }, []);

  const forceValidateJobs = useCallback(async () => {
    console.log("[ProcessingMonitor] Force validating all jobs");

    const processingJobs = activeJobs.filter(
      (job) => job.status === "processing" || job.status === "paused"
    );

    if (processingJobs.length === 0) {
      return;
    }

    try {
      const validationResults = await Promise.all(
        processingJobs.map(async (job) => {
          try {
            const sessionStatus = await studioAPI.checkSessionStatus(
              job.sessionId
            );

            if (!sessionStatus || sessionStatus.status === "cancelled") {
              return { sessionId: job.sessionId, shouldRemove: true };
            }

            if (
              sessionStatus.status === "completed" &&
              job.status !== "completed"
            ) {
              return {
                sessionId: job.sessionId,
                shouldRemove: false,
                update: {
                  status: "completed" as const,
                  completedAt: new Date(),
                },
              };
            }

            return { sessionId: job.sessionId, shouldRemove: false };
          } catch (error) {
            console.error(
              `[ProcessingMonitor] Failed to validate job ${job.sessionId}:`,
              error
            );
            return { sessionId: job.sessionId, shouldRemove: false };
          }
        })
      );

      const jobsToRemove = validationResults
        .filter((r) => r.shouldRemove)
        .map((r) => r.sessionId);

      const jobsToUpdate = validationResults
        .filter((r) => r.update)
        .reduce(
          (acc, r) => {
            acc[r.sessionId] = r.update!;
            return acc;
          },
          {} as Record<string, Partial<ActiveJob>>
        );

      if (jobsToRemove.length > 0 || Object.keys(jobsToUpdate).length > 0) {
        setActiveJobs((currentJobs) => {
          return currentJobs
            .filter((job) => !jobsToRemove.includes(job.sessionId))
            .map((job) =>
              jobsToUpdate[job.sessionId]
                ? { ...job, ...jobsToUpdate[job.sessionId] }
                : job
            );
        });
      }
    } catch (error) {
      console.error("[ProcessingMonitor] Force validation failed:", error);
    }
  }, [activeJobs]);

  const value: ProcessingMonitorContextType = {
    activeJobs,
    completedJobs,
    registerJob,
    updateJob,
    removeJob,
    getJob,
    clearAllJobs,
    clearHistory,
    forceValidateJobs,
  };

  return (
    <ProcessingMonitorContext.Provider value={value}>
      {children}
    </ProcessingMonitorContext.Provider>
  );
});

export const useProcessingMonitor = () => {
  const context = useContext(ProcessingMonitorContext);
  if (!context) {
    throw new Error(
      "useProcessingMonitor must be used within ProcessingMonitorProvider"
    );
  }
  return context;
};
