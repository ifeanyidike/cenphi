import { useState, useEffect, useRef, useCallback } from 'react';
import { authStore } from '@/stores/authStore';
import { connectSSE } from './sse/connection';

// Story Video specific types
export interface Clip {
  id: string;
  clip_id: string;
  testimonial_id: string;
  storage_path: string;
  preview_url?: string;
  start_time: number;
  end_time: number;
  duration: number;
  highlight_type: string;
  text_content: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface Stage {
  id: string;
  name: string;
  display_name: string;
  order: number;
  status: 'pending' | 'processing' | 'reviewing' | 'completed' | 'accepted' | 'failed' | 'skipped';
  progress: number;
  message?: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface StoryVideoSession {
  session_id: string;
  job_id: string;
  pipeline_type: 'story_video';
  auto_proceed: boolean;
  stages: Stage[];
  current_stage?: Stage;
  clips: Clip[];
  ordered_clips: Clip[];
  ordering_rationale?: string;
  confidence_score?: number;
  preview_url?: string;
  is_paused: boolean;
  error?: string;
}

export interface ClipExtractedEvent {
  event_type: 'clip_extracted';
  job_id: string;
  session_id: string;
  step_id: string;
  clip: Clip;
  progress: {
    clips_extracted: number;
    total_clips: number;
  };
  timestamp: string;
}

export interface ClipsReorderedEvent {
  event_type: 'clips_reordered';
  session_id: string;
  job_id: string;
  stage_id: string;
  data: {
    stage_id: string;
    ordered_clips: Clip[];
    clip_order: string[];
    clip_count: number;
  };
  timestamp: string;
}

interface UseStoryVideoSSEReturn {
  session: StoryVideoSession | null;
  isConnected: boolean;
  error: string | null;
  currentStage: Stage | null;
  stages: Stage[];
  clips: Clip[];
  orderedClips: Clip[];
  previewUrl: string | null;
  acceptStage: (stageId: string) => Promise<void>;
  retryStage: (stageId: string) => Promise<void>;
  skipStage: (stageId: string) => Promise<void>;
  selectClips: (selectedIds: string[], rejectedIds: string[]) => Promise<void>;
  reorderClips: (clipOrder: string[]) => Promise<void>;
  startSession: (sessionId: string, autoProceed: boolean) => void;
  stopSession: () => void;
}

export const useStoryVideoSSE = (): UseStoryVideoSSEReturn => {
  const [session, setSession] = useState<StoryVideoSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [orderedClips, setOrderedClips] = useState<Clip[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stopRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const stopSession = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setIsConnected(false);
    setError(null);
    sessionIdRef.current = null;
  }, []);

  const startSession = useCallback((sessionId: string, autoProceed: boolean) => {
    // Close existing connection
    stopSession();
    setCurrentStage(null);
    setStages([]);
    setClips([]);
    setOrderedClips([]);
    setPreviewUrl(null);

    try {
      sessionIdRef.current = sessionId;

      // Initialize session
      setSession({
        session_id: sessionId,
        job_id: sessionId,
        pipeline_type: 'story_video',
        auto_proceed: autoProceed,
        stages: [],
        clips: [],
        ordered_clips: [],
        is_paused: false,
      });

      stopRef.current = connectSSE(async () => {
        const token = await authStore.user?.getIdToken();
        if (!token) throw new Error("Authentication required");
        return `${import.meta.env.VITE_API_URL}/studio/sessions/${encodeURIComponent(sessionId)}/stream?token=${encodeURIComponent(token)}`;
      }, {
        onOpen: () => { setIsConnected(true); setError(null); },
        onError: (message) => { setIsConnected(false); setError(message); },
        onMessage: (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data || (data.session_id && data.session_id !== sessionId)) return;
          console.log('[Story Video SSE]', data.type || data.event_type, data);

          const eventType = data.type || data.event_type;

          switch (eventType) {
            case 'session_created':
            case 'job_created': {
              const stagesData = data.data?.stages || [];
              const initialStages: Stage[] = stagesData.map((stage: any) => ({
                id: stage.id || stage.stage_id,
                name: stage.name,
                display_name: stage.display_name,
                order: stage.order,
                status: stage.status || 'pending',
                progress: stage.progress || 0,
                message: stage.message || '',
                started_at: stage.started_at,
                completed_at: stage.completed_at,
                metadata: stage.metadata,
              }));

              setStages(initialStages);
              setSession(prev => prev ? { ...prev, stages: initialStages } : null);
              break;
            }

            case 'step_started': {
              const stageData = data.stage || data.data;
              if (!stageData) break;

              const stage: Stage = {
                id: stageData.id || data.stage_id,
                name: stageData.name,
                display_name: stageData.display_name,
                order: stageData.order,
                status: 'processing',
                progress: stageData.progress || 0,
                message: stageData.message,
                started_at: stageData.started_at,
                metadata: stageData.metadata,
              };

              setCurrentStage(stage);
              setStages(prev => {
                const idx = prev.findIndex(s => s.id === stage.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = stage;
                  return updated;
                }
                return [...prev, stage];
              });
              break;
            }

            case 'step_progress': {
              const stageData = data.stage || data.data;
              if (!stageData) break;

              const stageId = stageData.id || data.stage_id;
              const progress = stageData.progress || data.progress || 0;
              const message = stageData.message || data.message || '';

              setStages(prev => prev.map(s =>
                s.id === stageId ? { ...s, progress, message } : s
              ));

              setCurrentStage(prev =>
                prev && prev.id === stageId ? { ...prev, progress, message } : prev
              );

              // Extract metadata for clips if available
              if (data.metadata?.clips) {
                setClips(data.metadata.clips);
              }
              if (data.metadata?.ordered_clips) {
                setOrderedClips(data.metadata.ordered_clips);
              }
              break;
            }

            case 'clip_extracted': {
              // Per-clip event during extraction
              const clipData = data.clip;
              if (!clipData) break;

              setClips(prev => {
                const exists = prev.find(c => c.id === clipData.id);
                if (exists) return prev;
                return [...prev, clipData];
              });

              // Update progress
              const extractionProgress = data.progress;
              if (extractionProgress) {
                const percentComplete = extractionProgress.total_clips > 0
                  ? (extractionProgress.clips_extracted / extractionProgress.total_clips) * 100
                  : 0;

                setCurrentStage(prev => prev?.id === 'extract_clips' ? {
                  ...prev,
                  progress: percentComplete,
                  message: `Extracted ${extractionProgress.clips_extracted} of ${extractionProgress.total_clips} clips`
                } : prev);
              }
              break;
            }

            case 'clips_reordered': {
              const reorderedData = data.data;
              if (!reorderedData) break;

              setOrderedClips(reorderedData.ordered_clips || []);
              setSession(prev => prev ? {
                ...prev,
                ordered_clips: reorderedData.ordered_clips || []
              } : null);
              break;
            }

            case 'preview_ready': {
              const previewData = data.preview || data.data;
              if (!previewData) break;

              const url = previewData.content?.url || previewData.content || '';
              setPreviewUrl(url);
              break;
            }

            case 'step_complete': {
              const stageData = data.stage || data.data;
              if (!stageData) break;

              const stageId = stageData.id || data.stage_id;
              const status = stageData.status || 'completed';
              const requiresUserAction = data.data?.requires_user_action || false;

              const updatedStage: Stage = {
                id: stageId,
                name: stageData.name,
                display_name: stageData.display_name,
                order: stageData.order,
                status: status as Stage['status'],
                progress: 100,
                message: stageData.message,
                started_at: stageData.started_at,
                completed_at: stageData.completed_at,
                metadata: stageData.metadata,
              };

              setStages(prev => prev.map(s =>
                s.id === stageId ? updatedStage : s
              ));

              // If requires user action and status is reviewing, set as current stage
              if (requiresUserAction && status === 'reviewing') {
                setCurrentStage(updatedStage);
              } else {
                setCurrentStage(prev => prev?.id === stageId ? null : prev);
              }

              // Extract clips/ordered_clips from metadata
              if (stageData.metadata) {
                if (stageData.metadata.clips) {
                  setClips(stageData.metadata.clips);
                }
                if (stageData.metadata.ordered_clips) {
                  setOrderedClips(stageData.metadata.ordered_clips);
                  setSession(prev => prev ? {
                    ...prev,
                    ordered_clips: stageData.metadata.ordered_clips,
                    ordering_rationale: stageData.metadata.ordering_rationale,
                    confidence_score: stageData.metadata.confidence_score,
                  } : null);
                }
              }
              break;
            }

            case 'job_complete': {
              setSession(prev => prev ? { ...prev, is_paused: false } : null);
              setCurrentStage(null);
              break;
            }

            case 'session_paused': {
              setSession(prev => prev ? { ...prev, is_paused: true } : null);
              break;
            }

            case 'session_resumed': {
              setSession(prev => prev ? { ...prev, is_paused: false } : null);
              break;
            }

            case 'error': {
              const errorMessage = data.data?.message || data.data?.error || 'An error occurred';
              setError(errorMessage);
              setSession(prev => prev ? { ...prev, error: errorMessage } : null);

              if (data.stage_id) {
                setStages(prev => prev.map(s =>
                  s.id === data.stage_id
                    ? { ...s, status: 'failed', message: errorMessage }
                    : s
                ));
              }
              break;
            }

            case 'connection_established':
            case 'heartbeat':
              break;

            default:
              console.warn('[Story Video SSE] Unknown event type:', eventType);
          }
        } catch (err) {
          console.error('[Story Video SSE] Error parsing event:', err);
          setError('Failed to parse event data');
        }
        },
      });

    } catch (err) {
      console.error('[Story Video SSE] Failed to start connection:', err);
      setError('Failed to start session');
    }
  }, [stopSession]);

  // Control actions
  const acceptStage = useCallback(async (stageId: string) => {
    if (!sessionIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/sessions/${sessionIdRef.current}/stages/${stageId}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to accept stage');
      }

      // Update local state
      setStages(prev => prev.map(s =>
        s.id === stageId ? { ...s, status: 'accepted' } : s
      ));
    } catch (err) {
      console.error('[Story Video] Error accepting stage:', err);
      setError('Failed to accept stage');
    }
  }, []);

  const retryStage = useCallback(async (stageId: string) => {
    if (!sessionIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/sessions/${sessionIdRef.current}/stages/${stageId}/retry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to retry stage');
      }

      // Update local state
      setStages(prev => prev.map(s =>
        s.id === stageId ? { ...s, status: 'pending', progress: 0 } : s
      ));
    } catch (err) {
      console.error('[Story Video] Error retrying stage:', err);
      setError('Failed to retry stage');
    }
  }, []);

  const skipStage = useCallback(async (stageId: string) => {
    if (!sessionIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/sessions/${sessionIdRef.current}/stages/${stageId}/skip`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to skip stage');
      }

      setStages(prev => prev.map(s =>
        s.id === stageId ? { ...s, status: 'skipped' } : s
      ));
    } catch (err) {
      console.error('[Story Video] Error skipping stage:', err);
      setError('Failed to skip stage');
    }
  }, []);

  const selectClips = useCallback(async (selectedIds: string[], rejectedIds: string[]) => {
    if (!sessionIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/sessions/${sessionIdRef.current}/stages/extract_clips/select-clips`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            selected_clip_ids: selectedIds,
            rejected_clip_ids: rejectedIds,
            action: selectedIds.length > 0 ? 'accept' : 'reject',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to select clips');
      }

      // Update local clips state
      setClips(prev => prev.filter(clip => !rejectedIds.includes(clip.id)));
    } catch (err) {
      console.error('[Story Video] Error selecting clips:', err);
      setError('Failed to select clips');
    }
  }, []);

  const reorderClips = useCallback(async (clipOrder: string[]) => {
    if (!sessionIdRef.current) return;

    try {
      const token = await authStore.user?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/sessions/${sessionIdRef.current}/stages/ai_ordering/reorder-clips`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            clip_order: clipOrder,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reorder clips');
      }

      const result = await response.json();
      setOrderedClips(result.ordered_clips || []);
    } catch (err) {
      console.error('[Story Video] Error reordering clips:', err);
      setError('Failed to reorder clips');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return stopSession;
  }, [stopSession]);

  return {
    session,
    isConnected,
    error,
    currentStage,
    stages,
    clips,
    orderedClips,
    previewUrl,
    acceptStage,
    retryStage,
    skipStage,
    selectClips,
    reorderClips,
    startSession,
    stopSession,
  };
};
