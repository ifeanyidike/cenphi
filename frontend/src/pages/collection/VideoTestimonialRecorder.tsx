
import { collectionStore } from "@/stores/collectionStore";
import {
  GUIDED_PROMPTS,
  MAX_RECORDING_DURATION,
} from "@/components/collection/constants";
// import VideoRecorder from "@/components/collection/VideoRecorder";
import VideoRecorder2 from "@/components/collection/VideoRecorder2";



const VideoTestimonialRecorder = () => {
  

  // Example: get company info from collectionStore, authStore, or fallback
  const companyName = collectionStore.companyName || "Your Company";
  const companyLogoUrl = collectionStore.companyLogoUrl || "";
  const companyWebsite = "https://example.com";

  return (
    <>
      <VideoRecorder2
        companyName={companyName}
        companyLogoUrl={companyLogoUrl}
        companyWebsite={companyWebsite}
        onRecordingComplete={collectionStore.handleCompleteRecordingSection}
        maxDuration={MAX_RECORDING_DURATION / (GUIDED_PROMPTS.length || 1)}
      />
    
    </>
  );
};

export default VideoTestimonialRecorder;
