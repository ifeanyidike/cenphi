import TextCollection from "@/components/collection/TextCollection";
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
