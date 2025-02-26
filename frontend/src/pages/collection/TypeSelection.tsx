import TestimonialTypeSelection from "@/components/custom/collection/TestimonialTypeSelection";
import { AnimatePresence } from "framer-motion";

const TypeSelection = () => {
  return (
    <AnimatePresence mode="wait">
      <TestimonialTypeSelection />
    </AnimatePresence>
  );
};

export default TypeSelection;
