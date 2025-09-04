// import { observer } from "mobx-react-lite";
import { collectionStore } from "@/stores/collectionStore";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import TestimonialProgress from "@/components/collection/TestimonialProgress";
import {
  GUIDED_PROMPTS,
  MAX_RECORDING_DURATION,
} from "@/components/collection/constants";
import DisplayQuestion from "@/components/collection/DisplayQuestion";
import ChangeRenderType from "@/components/collection/ChangeRenderType";

const AudioTestimonialRecorder = () => {
  console.log('currentPromptIndex:', collectionStore.state.currentPromptIndex);
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

          <div className="text-sm text-gray-500 text-center">
            Audio recording is no longer available. Please use Upload or switch to Video/Text.
          </div>
        </div>

        <ChangeRenderType
          type={
            ["audio", "video", "text"].includes(state.type as string)
              ? (state.type as "audio" | "video" | "text")
              : null
          }
          isComplete={state.currentPromptIndex === GUIDED_PROMPTS.length - 1}
          onNext={() => collectionStore.handleNext(progress)}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioTestimonialRecorder;
