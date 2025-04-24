import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  Bell,
  FileText,
  MessageSquareText,
  Users,
} from "lucide-react";
import { GlassPanel } from "./components";
import { megaMenuVariants, menuItemVariants, notifications } from "./data";

// Get notification icon based on type
export const getNotificationIcon = (type: string) => {
  switch (type) {
    case "testimonial":
      return <MessageSquareText className="h-5 w-5 text-indigo-500" />;
    case "report":
      return <BarChart3 className="h-5 w-5 text-emerald-500" />;
    case "approval":
      return <FileText className="h-5 w-5 text-amber-500" />;
    case "quota":
      return <Award className="h-5 w-5 text-purple-500" />;
    case "project":
      return <Users className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

type Props = {
  isNotificationOpen: boolean;
  setIsNotificationOpen: (isOpen: boolean) => void;
  setActiveMenu: (menu: string | null) => void;
  setIsUserMenuOpen: (isOpen: boolean) => void;
  notificationRef: React.RefObject<HTMLDivElement | null>;
};
const NotificationBell = ({
  isNotificationOpen,
  setIsNotificationOpen,
  setActiveMenu,
  setIsUserMenuOpen,
  notificationRef,
}: Props) => {
  // Unread notification count
  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => {
          setIsNotificationOpen(!isNotificationOpen);
          setIsUserMenuOpen(false);
          setActiveMenu(null);
        }}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
        aria-label="Notifications"
      >
        <span className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 text-xs font-bold text-white bg-rose-500 rounded-full"
            >
              {unreadCount}
            </motion.span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            variants={megaMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-xl z-50"
          >
            <GlassPanel className="border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                  Mark all as read
                </button>
              </div>

              <div className="overflow-y-auto max-h-[50vh] divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                      <Bell className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      No new notifications
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      When you have notifications, they'll appear here
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      variants={menuItemVariants}
                      whileHover={{
                        backgroundColor: notification.isUnread
                          ? "rgba(248, 250, 252, 0.8)"
                          : "rgba(243, 244, 246, 0.5)",
                      }}
                      className={`p-4 flex gap-3 ${
                        notification.isUnread
                          ? "bg-blue-50/30 dark:bg-blue-900/10"
                          : ""
                      }`}
                    >
                      {notification.avatar ? (
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                          <img
                            src={notification.avatar}
                            alt="User avatar"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            notification.isUnread
                              ? "font-medium text-gray-900 dark:text-white"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                      {notification.isUnread && (
                        <div className="flex-shrink-0">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link
                  to="/notifications"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  View all notifications
                </Link>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
