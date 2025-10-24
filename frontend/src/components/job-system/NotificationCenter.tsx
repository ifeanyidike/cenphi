// components/job-system/NotificationCenter.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { observer } from "mobx-react-lite";
import {
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Video,
  FileText,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // Auto-dismiss after this many seconds
  service?: string;
  serviceName?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const serviceConfig = {
  enhancement: { icon: Sparkles, color: "from-purple-500 to-pink-500" },
  story_mode: { icon: Video, color: "from-blue-500 to-indigo-500" },
  clipping: { icon: Video, color: "from-orange-500 to-red-500" },
  content_generation: {
    icon: FileText,
    color: "from-green-500 to-emerald-500",
  },
  text_polishing: { icon: FileText, color: "from-violet-500 to-purple-500" },
  translation: { icon: FileText, color: "from-teal-500 to-cyan-500" },
  narration: { icon: FileText, color: "from-cyan-500 to-blue-500" },
  platform_optimizer: { icon: Video, color: "from-green-500 to-emerald-500" },
};

const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(notification.duration || 0);

  useEffect(() => {
    if (!notification.duration) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Use setTimeout to avoid setState during render
          setTimeout(() => onDismiss(notification.id), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [notification.duration, notification.id, onDismiss]);

  const getNotificationConfig = () => {
    switch (notification.type) {
      case "success":
        return {
          icon: CheckCircle2,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-900",
        };
      case "error":
        return {
          icon: AlertCircle,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-900",
        };
      default:
        return {
          icon: Bell,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-900",
        };
    }
  };

  const config = getNotificationConfig();
  const NotificationIcon = config.icon;

  // Service icon if available
  const service = notification.service
    ? serviceConfig[notification.service as keyof typeof serviceConfig]
    : null;
  const ServiceIcon = service?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      className={`mb-3 p-4 rounded-xl border ${config.bgColor} ${config.borderColor} shadow-sm`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {ServiceIcon && (
            <div
              className={`w-6 h-6 rounded bg-gradient-to-br ${service.color} flex items-center justify-center`}
            >
              <ServiceIcon className="w-3 h-3 text-white" />
            </div>
          )}
          <NotificationIcon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${config.titleColor}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>

              {notification.serviceName && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {notification.serviceName}
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(notification.id)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Action button */}
          {notification.action && (
            <div className="flex items-center justify-between mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={notification.action.onClick}
                className="text-xs h-7"
              >
                {notification.action.label}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>

              {notification.duration && timeLeft > 0 && (
                <span className="text-xs text-gray-500">
                  Auto-close in {timeLeft}s
                </span>
              )}
            </div>
          )}

          {/* Auto-close timer without action */}
          {!notification.action && notification.duration && timeLeft > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Auto-close in {timeLeft}s</span>
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gray-400 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{
                      width: `${(timeLeft / (notification.duration || 1)) * 100}%`,
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const NotificationCenter: React.FC<NotificationCenterProps> = observer(
  ({ notifications, onDismiss, onDismissAll }) => {
    if (notifications.length === 0) return null;

    const center = (
      <div className="fixed top-4 right-4 z-[9998] w-96 max-w-sm">
        <AnimatePresence>
          {notifications.length > 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onDismissAll}
                className="w-full h-8 text-xs bg-white/90 backdrop-blur-sm"
              >
                <X className="w-3 h-3 mr-1" />
                Dismiss All ({notifications.length})
              </Button>
            </motion.div>
          )}

          {notifications.slice(0, 3).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={onDismiss}
            />
          ))}

          {notifications.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Badge
                variant="secondary"
                className="bg-white/90 backdrop-blur-sm"
              >
                +{notifications.length - 3} more notifications
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );

    return createPortal(center, document.body);
  }
);

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [
      {
        ...notification,
        id,
      },
      ...prev,
    ]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  // Auto-cleanup old notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      setNotifications((prev) => prev.slice(0, 10)); // Keep only 10 most recent
    }, 30000); // Cleanup every 30 seconds

    return () => clearInterval(cleanup);
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    dismissAll,
  };
};

export default NotificationCenter;
