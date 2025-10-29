import { createPortal } from "react-dom";
import { motion } from "framer-motion";

type Props = {
  isOpen: boolean;
  children: React.ReactNode;
};
const ModalPortal = ({ isOpen, children }: Props) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
      style={{ margin: 0, padding: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[calc(100vh-4rem)] overflow-hidden"
      >
        {children}
      </motion.div>
    </div>,
    document.body
  );
};

export default ModalPortal;
