// frontend/src/services/artifactService.ts
import { useApiClient } from "./apiClient";

export const useArtifactService = () => {
  const { del } = useApiClient();

  const deleteArtifact = async (artifactId: string): Promise<void> => {
    await del(`/api/ai/artifacts/${artifactId}`);
  };

  const deleteClip = async (
    artifactId: string,
    clipId: string
  ): Promise<{ message: string; remaining_clips: number }> => {
    return await del(`/api/ai/artifacts/${artifactId}/clips/${clipId}`);
  };

  return {
    deleteArtifact,
    deleteClip,
  };
};
