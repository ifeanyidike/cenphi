import { ProcessingStage } from '../useSessionSSE';

export interface ClipData {
  id: string;
  title: string;
  duration: number;
  start_time: number;
  end_time: number;
  theme: string;
  preview_url: string;
}

export interface PreviewType {
  type: 'single' | 'multi-clip' | 'none';
  clips?: ClipData[];
  stageId?: string;
}

/**
 * Determines what type of preview to show based on stage data
 */
export const detectPreviewType = (stages: ProcessingStage[]): PreviewType => {
  // Check for extract_clips stage with clips
  const extractClipsStage = stages.find(s => s.stage_id === 'extract_clips');

  if (extractClipsStage?.metadata?.clips) {
    const clips = extractClipsStage.metadata.clips;

    if (Array.isArray(clips) && clips.length > 0) {
      return {
        type: 'multi-clip',
        clips: clips.map((clip: any) => ({
          id: clip.id,
          title: clip.title || clip.theme || `Clip ${clip.id}`,
          duration: clip.duration || 0,
          start_time: clip.start_time || 0,
          end_time: clip.end_time || 0,
          theme: clip.theme || '',
          preview_url: clip.url,
        })),
        stageId: extractClipsStage.stage_id,
      };
    }
  }

  // No clips - show single preview
  return { type: 'single' };
};

/**
 * Checks if a stage has clips metadata
 */
export const hasClipsMetadata = (stage: ProcessingStage | undefined): boolean => {
  if (!stage?.metadata?.clips) return false;
  return Array.isArray(stage.metadata.clips) && stage.metadata.clips.length > 0;
};
