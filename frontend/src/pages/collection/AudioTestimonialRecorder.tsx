import { observer } from "mobx-react-lite";
import { collectionStore } from "@/stores/collectionStore";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import TestimonialProgress from "@/components/collection/TestimonialProgress";
import {
  GUIDED_PROMPTS,
  MAX_RECORDING_DURATION,
} from "@/components/collection/constants";
import DisplayQuestion from "@/components/collection/DisplayQuestion";
import AudioRecorder from "@/components/collection/AudioRecorder";
import ChangeRenderType from "@/components/collection/ChangeRenderType";

const AudioTestimonialRecorder = observer(() => {
  const state = collectionStore.state;
  const progress = useMotionValue(0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{ minHeight: "90vh" }}
        className="max-w-screen-xl mx-auto flex flex-col justify-center"
      >
        <TestimonialProgress
          progress={progress}
          currentStep={state.currentPromptIndex}
          totalSteps={GUIDED_PROMPTS.length}
        />

        <div className="bg-white rounded-xl shadow-lg p-6 mt-4 mb-8">
          <DisplayQuestion />

          <AudioRecorder
            onRecordingComplete={collectionStore.handleCompleteRecordingSection}
            maxDuration={MAX_RECORDING_DURATION / (GUIDED_PROMPTS.length || 1)}
          />
        </div>

        <ChangeRenderType
          type={state.type}
          isComplete={state.currentPromptIndex === GUIDED_PROMPTS.length - 1}
          onNext={() => collectionStore.handleNext(progress)}
        />
      </motion.div>
    </AnimatePresence>
  );
});

export default AudioTestimonialRecorder;
