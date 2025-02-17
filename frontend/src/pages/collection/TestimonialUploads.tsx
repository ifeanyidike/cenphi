import ChangeRenderType from "@/components/custom/collection/ChangeRenderType";
import { GUIDED_PROMPTS } from "@/components/custom/collection/constants";
import FileUpload from "@/components/custom/collection/FileUpload";
import TestimonialProgress from "@/components/custom/collection/TestimonialProgress";
import { TestimonialType } from "@/components/custom/collection/types";
import { collectionStore } from "@/stores/collectionStore";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

type RouteParams = { type: TestimonialType };
const TestimonialUploads = observer(() => {
  const state = collectionStore.state;
  const progress = useMotionValue(0);
  const { type } = useParams<RouteParams>();

  useEffect(() => {
    if (type) {
      runInAction(() => collectionStore.setType(type));
    }
  }, [type]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-screen-xl mx-auto min-h-screen md:max-h-screen flex flex-col justify-center"
      >
        <TestimonialProgress
          progress={progress}
          currentStep={state.currentPromptIndex}
          totalSteps={GUIDED_PROMPTS.length}
        />
        <FileUpload
          type={(state.type || type) as "video" | "audio"}
          onComplete={collectionStore.handleComplete}
          maxSize={
            state.type === "video" ? 500 * 1024 * 1024 : 100 * 1024 * 1024
          }
        />
        <ChangeRenderType
          type={state.type}
          isComplete={state.currentPromptIndex === GUIDED_PROMPTS.length - 1}
        />
      </motion.div>
    </AnimatePresence>
  );
});

export default TestimonialUploads;
