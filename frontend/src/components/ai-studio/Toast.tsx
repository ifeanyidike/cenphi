// components/ai-studio/Toast.tsx
import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

// Toast Notification Component
const Toast: React.FC<{
  message: string;
  action?: string;
  onAction?: () => void;
  onClose: () => void;
}> = ({ message, action, onAction, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 50, scale: 0.95 }}
    className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-lg p-4 max-w-md z-50"
  >
    <div className="flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{message}</p>
        {action && (
          <button
            onClick={onAction}
            className="p-0 h-auto text-blue-600 font-medium text-sm underline mt-1"
          >
            {action}
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="h-6 w-6 p-0 flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </motion.div>
);
export default Toast;
