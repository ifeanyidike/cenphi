import { ProcessingStage, ProcessingSession, PreviewArtifact } from '../useSessionSSE';

export interface EventHandlerContext {
  sessionId: string;
  setSession: React.Dispatch<React.SetStateAction<ProcessingSession | null>>;
  setStages: React.Dispatch<React.SetStateAction<ProcessingStage[]>>;
  setCurrentStage: React.Dispatch<React.SetStateAction<ProcessingStage | null>>;
  setLatestPreview: React.Dispatch<React.SetStateAction<PreviewArtifact | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const handleSessionCreated = (
  sseEvent: any,
  ctx: EventHandlerContext
) => {
  const sessionData = sseEvent.data;

  ctx.setSession({
    id: sessionData.session_id || ctx.sessionId,
    testimonial_id: sessionData.testimonial_id,
    workspace_id: sessionData.workspace_id,
    session_type: sessionData.type || sessionData.session_type,
    status: sessionData.status || 'active',
    auto_proceed: sessionData.auto_proceed || false,
    total_steps: sessionData.total_steps || 0,
    completed_steps: 0,
    skipped_steps: 0,
    started_at: sessionData.started_at || new Date().toISOString(),
  });

  const initialStages = sessionData.stages || [];
  if (Array.isArray(initialStages) && initialStages.length > 0) {
    const mappedStages: ProcessingStage[] = initialStages.map((stage: any) => ({
      id: stage.id || stage.ID,
      session_id: sessionData.session_id || ctx.sessionId,
      stage_id: stage.stage_id || stage.id || stage.ID,
      stage_name: stage.stage_name || stage.name || stage.Name,
      display_name: stage.display_name || stage.DisplayName || stage.name || stage.Name,
      stage_order: stage.stage_order || stage.order || stage.Order || 0,
      status: stage.status || 'pending',
      progress: stage.progress || stage.Progress || 0,
      message: stage.message || stage.Message || '',
      skip_reason: stage.skip_reason,
      started_at: stage.started_at || stage.StartedAt,
      completed_at: stage.completed_at || stage.CompletedAt,
      metadata: stage.metadata,
    }));

    ctx.setStages(mappedStages.sort((a, b) => a.stage_order - b.stage_order));

    // Set currentStage if there's a stage that's currently processing
    const processingStage = mappedStages.find(s => s.status === 'processing');
    if (processingStage) {
      ctx.setCurrentStage(processingStage);
    }
  }
};

export const handleStageStarted = (
  sseEvent: any,
  ctx: EventHandlerContext
) => {
  const stageData = (sseEvent as any).stage || sseEvent.data;
  if (!stageData) return;

  const newStage: ProcessingStage = {
    id: stageData.id || stageData.ID,
    session_id: sseEvent.session_id || ctx.sessionId,
    stage_id: stageData.stage_id || stageData.id || stageData.ID,
    stage_name: stageData.stage_name || stageData.name || stageData.Name,
    display_name: stageData.display_name || stageData.DisplayName || stageData.name || stageData.Name,
    stage_order: stageData.stage_order || stageData.order || stageData.Order || 0,
    status: 'processing',
    progress: stageData.progress || 0,
    message: stageData.message || '',
    started_at: stageData.started_at || stageData.StartedAt,
  };

  ctx.setCurrentStage(newStage);
  ctx.setStages(prev => {
    const existing = prev.find(s => s.stage_id === newStage.stage_id);
    if (existing) {
      return prev.map(s => s.stage_id === newStage.stage_id ? newStage : s);
    }
    return [...prev, newStage].sort((a, b) => a.stage_order - b.stage_order);
  });
};

export const handleStageProgress = (
  sseEvent: any,
  ctx: EventHandlerContext
) => {
  const stageData = (sseEvent as any).stage || sseEvent.data;
  if (!stageData) return;

  const stageId = stageData.stage_id || stageData.id || (sseEvent as any).stage_id;
  const progress = stageData.progress || 0;
  const message = stageData.message || '';

  ctx.setStages(prev =>
    prev.map(s =>
      s.stage_id === stageId
        ? { ...s, progress, message, status: 'processing' }
        : s
    )
  );

  ctx.setCurrentStage(prev =>
    prev && prev.stage_id === stageId
      ? { ...prev, progress, message }
      : prev
  );
};

export const handleStageComplete = (
  sseEvent: any,
  ctx: EventHandlerContext
) => {
  const stageData = (sseEvent as any).stage || sseEvent.data;
  if (!stageData) return;

  const stageId = stageData.stage_id || stageData.id || (sseEvent as any).stage_id;

  // Log clips completion
  if (stageId === 'extract_clips' && stageData.metadata?.clips?.length > 0) {
    console.log(`[SSE] Extracted ${stageData.metadata.clips.length} clips`);
  }

  ctx.setStages(prev =>
    prev.map(s =>
      s.stage_id === stageId
        ? {
            ...s,
            status: 'completed',
            progress: 100,
            completed_at: stageData.completed_at || stageData.CompletedAt || new Date().toISOString(),
            metadata: stageData.metadata || s.metadata,
          }
        : s
    )
  );

  ctx.setCurrentStage(prev => (prev?.stage_id === stageId ? null : prev));
  ctx.setSession(prev =>
    prev ? { ...prev, completed_steps: (prev.completed_steps || 0) + 1 } : null
  );
};

export const handlePreviewReady = (
  sseEvent: any,
  ctx: EventHandlerContext
) => {
  const previewData = (sseEvent as any).preview || sseEvent.data;
  if (!previewData) return;

  const stageId = previewData.stage_id || (sseEvent as any).stage_id;
  const eventData = (sseEvent as any).data || {};
  const isClipPreview = eventData.clip_index !== undefined;

  // Skip individual clip previews - they're handled via step_complete metadata
  if (isClipPreview) return;

  const previewType = previewData.type || previewData.artifact_type || 'video';
  const isJsonPreview = previewType === 'json';

  // Extract preview URL
  let previewUrl = previewData.preview_url || previewData.url || '';
  if (!previewUrl && previewData.content && typeof previewData.content === 'string') {
    previewUrl = previewData.content;
  }

  const preview: PreviewArtifact = {
    id: previewData.id || '',
    session_id: sseEvent.session_id || ctx.sessionId,
    stage_id: stageId,
    storage_path: previewData.storage_path || '',
    preview_url: previewUrl,
    artifact_type: previewType,
    file_size_bytes: previewData.file_size_bytes,
    metadata: previewData.metadata,
    created_at: previewData.created_at || new Date().toISOString(),
  };

  // Only set latest preview for actual video/image previews (not JSON)
  if (!isJsonPreview && previewUrl) {
    ctx.setLatestPreview(preview);
  }

  // Update stage metadata
  ctx.setStages(prev =>
    prev.map(s =>
      s.stage_id === stageId
        ? {
            ...s,
            metadata: {
              ...s.metadata,
              preview_url: preview.preview_url,
              duration: previewData.metadata?.duration,
              width: previewData.metadata?.width,
              height: previewData.metadata?.height,
              aspect_ratio: previewData.metadata?.aspect_ratio,
            },
          }
        : s
    )
  );
};
