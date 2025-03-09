import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import TestimonialProgress from "@/components/collection/TestimonialProgress";
import ChangeRenderType from "@/components/collection/ChangeRenderType";
import DisplayQuestion from "@/components/collection/DisplayQuestion";
import { observer } from "mobx-react-lite";
import { collectionStore } from "@/stores/collectionStore";
import {
  GUIDED_PROMPTS,
  MAX_RECORDING_DURATION,
} from "@/components/collection/constants";
import VideoRecorder from "@/components/collection/VideoRecorder";
import { AIFeedback } from "@/components/collection/AIFeedback";

const VideoTestimonialRecorder = observer(() => {
  const state = collectionStore.state;
  const progress = useMotionValue(0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-screen-xl mx-auto pt-8"
      >
        <TestimonialProgress
          progress={progress}
          currentStep={state.currentPromptIndex}
          totalSteps={GUIDED_PROMPTS.length}
        />

        <div className="bg-white rounded-xl shadow-lg  mt-8 p-6 mb-8">
          <DisplayQuestion />
          <VideoRecorder
            onRecordingComplete={collectionStore.handleCompleteRecordingSection}
            maxDuration={MAX_RECORDING_DURATION / (GUIDED_PROMPTS.length || 1)}
          />
        </div>

        {state.feedback && (
          <AIFeedback feedback={state.feedback} className="mb-8" />
        )}
        <ChangeRenderType
          type={state.type}
          isComplete={state.currentPromptIndex === GUIDED_PROMPTS.length - 1}
          onNext={() => collectionStore.handleNext(progress)}
        />
      </motion.div>
    </AnimatePresence>
  );
});

export default VideoTestimonialRecorder;
