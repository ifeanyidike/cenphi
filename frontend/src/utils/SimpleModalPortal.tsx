import { createPortal } from "react-dom";

type Props = {
  isOpen: boolean;
  children: React.ReactNode;
  onClose?: () => void;
};

/**
 * Simple modal portal wrapper with consistent z-index and backdrop
 * Use this for all modals to ensure proper layering above sidebar
 */
const SimpleModalPortal = ({ isOpen, children, onClose }: Props) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
      style={{ margin: 0, padding: 0 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default SimpleModalPortal;
