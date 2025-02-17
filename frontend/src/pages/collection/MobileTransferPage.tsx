import { collectionStore } from "@/stores/collectionStore";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import TestimonialProgress from "@/components/custom/collection/TestimonialProgress";
import ChangeRenderType from "@/components/custom/collection/ChangeRenderType";
import { GUIDED_PROMPTS } from "@/components/custom/collection/constants";
import MobileTransfer from "@/components/custom/collection/MobileTransfer";
import { useSearchParams } from "react-router-dom";

const MobileTransferPage = observer(() => {
  const state = collectionStore.state;
  const progress = useMotionValue(0);
  const searchParams = useSearchParams()[0];
  // console
  const p = searchParams.get("mode");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-screen-xl mx-auto"
      >
        <TestimonialProgress
          progress={progress}
          currentStep={state.currentPromptIndex}
          totalSteps={GUIDED_PROMPTS.length}
        />
        <MobileTransfer />

        <ChangeRenderType
          type={state.type || (p as "video" | "audio")}
          isComplete={state.currentPromptIndex === GUIDED_PROMPTS.length - 1}
        />
      </motion.div>
    </AnimatePresence>
  );
});

export default MobileTransferPage;
