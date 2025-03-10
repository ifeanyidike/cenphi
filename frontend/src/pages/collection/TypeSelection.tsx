import TestimonialTypeSelection from "@/components/collection/TestimonialTypeSelection";
import { AnimatePresence } from "framer-motion";

const TypeSelection = () => {
  return (
    <AnimatePresence mode="wait">
      <TestimonialTypeSelection />
    </AnimatePresence>
  );
};

export default TypeSelection;
