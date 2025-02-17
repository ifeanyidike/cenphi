import TextCollection from "@/components/custom/collection/TextCollection";
import { AnimatePresence } from "framer-motion";

const TextTestimonialCollection = () => {
  return (
    <>
      <AnimatePresence mode="wait">
        <TextCollection />
      </AnimatePresence>
    </>
  );
};

export default TextTestimonialCollection;
