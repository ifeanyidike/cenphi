import { useState, useEffect, useRef, useCallback } from 'react';
import { authStore } from '@/stores/authStore';

// SSE Event Types based on backend implementation
export interface StepProgress {
  jobId: string;
  stepId: string;
  stepName: string;
  progress: number;
  message?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface PreviewArtifact {
  jobId: string;
  stepId: string;
  stepName: string;
  previewUrl: string;
  previewType: 'video' | 'image' | 'audio' | 'thumbnail';
  duration?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface StudioEvent {
  id: string;
  type: 'connection_established' | 'session_created' | 'job_created' | 'step_started' | 'step_progress' | 'preview_ready' | 'text_optimization_complete' | 'step_complete' | 'job_complete' | 'error' | 'heartbeat' | 'session_paused' | 'session_resumed' | 'clips_already_exist';
  session_id: string;
  stage_id?: string;
  job_id?: string;
  testimonial_id?: string;
  workspace_id?: string;
  stage?: {
    id: string;
    name: string;
    display_name: string;
    order: number;
    status: string;
    progress: number;
    message?: string;
    started_at?: string;
    completed_at?: string;
  };
  preview?: {
    type: string;
    content: any;
    stage_id: string;
    quality?: number;
    is_partial?: boolean;
  };
  data?: any;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ExistingClip {
  id: string;
  title: string;
  url: string;
  theme?: string;
  duration?: number;
}

export interface ExistingClipsNotification {
  existing_count: number;
  new_count: number;
  total_requested: number;
  message: string;
  existing_clips: ExistingClip[];
  highlight_type?: string;
  show_clips_button?: boolean;
}

export interface JobSession {
  jobId: string;
  pipelineType: 'platform_optimization' | 'clipping' | 'story_video';
  steps: StepProgress[];
  isPaused: boolean;
  error?: string;
}

interface UseStudioSSEReturn {
  session: JobSession | null;
  isConnected: boolean;
  error: string | null;
  currentStep: StepProgress | null;
  latestPreview: PreviewArtifact | null;
  allPreviews: Map<string, PreviewArtifact>; // stepId → preview
  existingClipsNotification: ExistingClipsNotification | null;
  startSession: (jobId: string, pipelineType: 'platform_optimization' | 'clipping' | 'story_video') => void;
  stopSession: () => void;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  skipStep: (stepId: string) => Promise<void>;
  retryStep: (stepId: string) => Promise<void>;
  dismissExistingClipsNotification: () => void;
}

export const useStudioSSE = (): UseStudioSSEReturn => {
  const [session, setSession] = useState<JobSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepProgress | null>(null);
  const [latestPreview, setLatestPreview] = useState<PreviewArtifact | null>(null);
  const [allPreviews, setAllPreviews] = useState<Map<string, PreviewArtifact>>(new Map());
  const [existingClipsNotification, setExistingClipsNotification] = useState<ExistingClipsNotification | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const stopSession = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setError(null);
    jobIdRef.current = null;
  }, []);

  const startSession = useCallback(async (
    jobId: string,
    pipelineType: 'platform_optimization' | 'clipping' | 'story_video'
  ) => {
    // Close existing connection
    stopSession();

    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      jobIdRef.current = jobId;

      // DON'T initialize session yet - wait for session_created event from backend
      // This prevents showing "0 / 0 steps" UI before stages are loaded
      setSession(null);

      // Connect to SSE endpoint (correct route: /studio/sessions/{sessionID}/stream)
      const sseUrl = `${import.meta.env.VITE_API_URL}/studio/sessions/${jobId}/stream`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const studioEvent: StudioEvent = JSON.parse(event.data);
          console.log('[SSE Event]', studioEvent.type, studioEvent);

          switch (studioEvent.type) {
            case 'session_created':
            case 'job_created':
              // Extract stages from the event data
              const stages = studioEvent.data?.stages || [];
              console.log('[SSE] Session created with stages:', stages);

              // Convert stages to StepProgress format
              const initialSteps: StepProgress[] = stages.map((stage: any) => ({
                jobId: studioEvent.session_id,
                stepId: stage.id || stage.ID,
                stepName: stage.name || stage.Name,
                progress: stage.progress || stage.Progress || 0,
                status: stage.status === 'processing' ? 'in_progress' as const : 'pending' as const,
                message: stage.message || stage.Message || '',
                startedAt: stage.started_at || stage.StartedAt,
              }));

              console.log('[SSE] Converted steps:', initialSteps);

              setSession({
                jobId: studioEvent.session_id || studioEvent.data?.session_id,
                pipelineType: pipelineType,
                steps: initialSteps,
                isPaused: false,
              });
              break;

            case 'step_started': {
              // Backend sends stage data in the 'stage' field
              const stageData = studioEvent.stage || studioEvent.data;
              if (!stageData) {
                console.warn('[SSE] step_started event missing stage data:', studioEvent);
                break;
              }

              const stepData: StepProgress = {
                jobId: studioEvent.session_id,
                stepId: stageData.id || studioEvent.stage_id || '',
                stepName: stageData.name || stageData.display_name || '',
                progress: stageData.progress || 0,
                status: 'in_progress',
                startedAt: stageData.started_at,
                message: stageData.message,
              };

              console.log('[SSE] Step started:', stepData);
              setCurrentStep(stepData);

              setSession(prev => {
                if (!prev) return null;
                const existingStepIndex = prev.steps.findIndex(s => s.stepId === stepData.stepId);
                const updatedSteps = existingStepIndex >= 0
                  ? prev.steps.map((s, i) => i === existingStepIndex ? stepData : s)
                  : [...prev.steps, stepData];

                console.log('[SSE] Updated steps:', updatedSteps);
                return { ...prev, steps: updatedSteps };
              });
              break;
            }

            case 'step_progress': {
              const stageData = studioEvent.stage || studioEvent.data;
              if (!stageData) break;

              const stepId = stageData.id || studioEvent.stage_id;
              const progress = stageData.progress || 0;
              const message = stageData.message || '';

              setSession(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  steps: prev.steps.map(s =>
                    s.stepId === stepId
                      ? { ...s, progress, message }
                      : s
                  ),
                };
              });

              setCurrentStep(prev => {
                if (!prev || prev.stepId !== stepId) return prev;
                return {
                  ...prev,
                  progress,
                  message,
                };
              });
              break;
            }

            case 'preview_ready': {
              const previewData = studioEvent.preview || studioEvent.data;
              if (!previewData) {
                console.warn('[SSE] preview_ready event missing preview data:', studioEvent);
                break;
              }

              const preview: PreviewArtifact = {
                jobId: studioEvent.session_id,
                stepId: previewData.stage_id || studioEvent.stage_id || '',
                stepName: previewData.stage_id || '',
                previewUrl: previewData.content?.url || previewData.content || '',
                previewType: previewData.type || 'video',
                metadata: studioEvent.metadata,
              };

              console.log('[SSE] Preview ready:', preview);
              setLatestPreview(preview);
              setAllPreviews(prev => new Map(prev).set(preview.stepId, preview));
              break;
            }

            case 'text_optimization_complete': {
              // Text optimization doesn't create a preview artifact
              // It only updates the stage metadata which will be shown below the video
              console.log('[SSE] Text optimization complete:', studioEvent.data);

              // Don't create a preview - just update the step's metadata
              setSession(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  steps: prev.steps.map(s =>
                    s.stepId === studioEvent.stage_id
                      ? { ...s, metadata: studioEvent.data }
                      : s
                  ),
                };
              });
              break;
            }

            case 'step_complete': {
              const stageData = studioEvent.stage || studioEvent.data;
              if (!stageData) break;

              const stepId = stageData.id || studioEvent.stage_id;

              setSession(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  steps: prev.steps.map(s =>
                    s.stepId === stepId
                      ? { ...s, status: 'completed', progress: 100, completedAt: stageData.completed_at }
                      : s
                  ),
                };
              });

              // Clear current step if it's the one that completed
              setCurrentStep(prev =>
                prev?.stepId === stepId ? null : prev
              );
              break;
            }

            case 'job_complete':
              setSession(prev => prev ? { ...prev, isPaused: false } : null);
              setCurrentStep(null);
              break;

            case 'session_paused':
              setSession(prev => prev ? { ...prev, isPaused: true } : null);
              break;

            case 'session_resumed':
              setSession(prev => prev ? { ...prev, isPaused: false } : null);
              break;

            case 'error':
              const errorMessage = studioEvent.data?.message || studioEvent.data?.error || 'An error occurred';
              setError(errorMessage);
              setSession(prev => prev ? { ...prev, error: errorMessage } : null);

              // Mark step as failed if error is for a specific step
              if (studioEvent.stage_id || studioEvent.data?.stepId) {
                const failedStepId = studioEvent.stage_id || studioEvent.data?.stepId;
                setSession(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    steps: prev.steps.map(s =>
                      s.stepId === failedStepId
                        ? { ...s, status: 'failed', message: errorMessage }
                        : s
                    ),
                  };
                });
              }
              break;

            case 'connection_established':
              console.log('[SSE] Connection established');
              break;

            case 'clips_already_exist': {
              // Handle existing clips notification
              const notificationData = studioEvent.data;
              if (notificationData) {
                console.log('[SSE] Clips already exist:', notificationData);
                setExistingClipsNotification({
                  existing_count: notificationData.existing_count || 0,
                  new_count: notificationData.new_count || 0,
                  total_requested: notificationData.total_requested || 0,
                  message: notificationData.message || 'Some clips already exist',
                  existing_clips: notificationData.existing_clips || [],
                  highlight_type: notificationData.highlight_type,
                  show_clips_button: notificationData.show_clips_button,
                });
              }
              break;
            }

            case 'heartbeat':
              // Heartbeat to keep connection alive
              break;

            default:
              console.warn('[SSE] Unknown event type:', studioEvent.type);
          }
        } catch (err) {
          console.error('[SSE] Error parsing event:', err, 'Raw data:', event.data);
          setError('Failed to parse event data');
        }
      };

      eventSource.onerror = (event) => {
        console.error('[SSE] Connection error:', event, 'ReadyState:', eventSource.readyState);
        setIsConnected(false);

        // Only show error message if connection is closed
        if (eventSource.readyState === EventSource.CLOSED) {
          setError('Connection lost. Retrying...');

          // Auto-retry connection after 3 seconds
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED && jobIdRef.current) {
              console.log('[SSE] Attempting to reconnect...');
              startSession(jobIdRef.current, pipelineType);
            }
          }, 3000);
        }
      };

    } catch (err) {
      console.error('Failed to start SSE connection:', err);
      setError('Failed to start session');
    }
  }, [stopSession]);

  // Control actions (pause/resume/skip/retry)
  const pauseSession = useCallback(async () => {
    if (!jobIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/studio/sessions/${jobIdRef.current}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to pause session');
      }
    } catch (err) {
      console.error('Error pausing session:', err);
      setError('Failed to pause session');
    }
  }, []);

  const resumeSession = useCallback(async () => {
    if (!jobIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/studio/sessions/${jobIdRef.current}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to resume session');
      }
    } catch (err) {
      console.error('Error resuming session:', err);
      setError('Failed to resume session');
    }
  }, []);

  const skipStep = useCallback(async (stepId: string) => {
    if (!jobIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/studio/sessions/${jobIdRef.current}/stages/${stepId}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to skip step');
      }

      // Update local state immediately
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          steps: prev.steps.map(s =>
            s.stepId === stepId
              ? { ...s, status: 'skipped' as const }
              : s
          ),
        };
      });
    } catch (err) {
      console.error('Error skipping step:', err);
      setError('Failed to skip step');
    }
  }, []);

  const retryStep = useCallback(async (stepId: string) => {
    if (!jobIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/studio/sessions/${jobIdRef.current}/stages/${stepId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to retry step');
      }

      // Update local state immediately
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          steps: prev.steps.map(s =>
            s.stepId === stepId
              ? { ...s, status: 'pending' as const, progress: 0 }
              : s
          ),
        };
      });
    } catch (err) {
      console.error('Error retrying step:', err);
      setError('Failed to retry step');
    }
  }, []);

  const dismissExistingClipsNotification = useCallback(() => {
    setExistingClipsNotification(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return stopSession;
  }, [stopSession]);

  return {
    session,
    isConnected,
    error,
    currentStep,
    latestPreview,
    allPreviews,
    existingClipsNotification,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    skipStep,
    retryStep,
    dismissExistingClipsNotification,
  };
};
