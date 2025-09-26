// components/ai-studio/Toast.tsx
import { motion } from "framer-motion";
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: ReactNode;
  type?: ToastType;
  action?: string;
  onAction?: () => void;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  action,
  onAction,
  onClose,
}) => {
  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-emerald-600",
          accentColor: "border-l-emerald-500",
          bgColor: "bg-white",
        };
      case "error":
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          accentColor: "border-l-red-500",
          bgColor: "bg-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-amber-600",
          accentColor: "border-l-amber-500",
          bgColor: "bg-white",
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-600",
          accentColor: "border-l-blue-500",
          bgColor: "bg-white",
        };
    }
  };

  const config = getToastConfig(type);
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: 100 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 50, x: 100 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className={`
        fixed top-4 right-4
        ${config.bgColor}
        border border-gray-200 ${config.accentColor}
        border-l-4
        shadow-lg
        rounded-lg 
        p-4 
        max-w-sm
        z-[9999]
        min-w-[320px]
      `}
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${config.iconColor} mt-0.5`}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 leading-5">
            {message}
          </div>

          {action && onAction && (
            <button
              onClick={onAction}
              className="
                mt-2
                text-sm font-medium 
                text-blue-600 hover:text-blue-800
                transition-colors duration-150
                underline underline-offset-2
                hover:underline-offset-4
              "
            >
              {action}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="
            flex items-center justify-center
            w-6 h-6 
            text-gray-400 hover:text-gray-600 
            hover:bg-gray-100
            rounded-md
            transition-colors duration-150
            -mt-0.5 -mr-1
          "
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default Toast;
