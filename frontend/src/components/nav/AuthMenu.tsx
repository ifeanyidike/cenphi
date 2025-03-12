import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Settings, User, LogOut, Sparkles } from "lucide-react";
import { GlassPanel } from "./components";
import { megaMenuVariants } from "./data";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { generateColorFromText } from "@/util/general";
import { User as AuthUser } from "firebase/auth";

type Props = {
  setIsUserMenuOpen: (isOpen: boolean) => void;
  setIsNotificationOpen: (isOpen: boolean) => void;
  setActiveMenu: (menu: string | null) => void;
  userMenuRef: React.RefObject<HTMLDivElement>;
  isUserMenuOpen: boolean;
  className: string;
};
const AuthMenu = observer(
  ({
    setIsUserMenuOpen,
    setIsNotificationOpen,
    setActiveMenu,
    userMenuRef,
    isUserMenuOpen,
    className,
  }: Props) => {
    const user = authStore.user;

    return (
      <>
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationOpen(false);
                setActiveMenu(null);
              }}
              className="flex items-center"
            >
              <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 flex items-center justify-center border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
                {profilePicture(user)}
                {user && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <Sparkles className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  variants={megaMenuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
                >
                  <GlassPanel className="border border-gray-200 dark:border-gray-700 shadow-xl">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {/* <img
                            src="https://randomuser.me/api/portraits/women/24.jpg"
                            alt="User profile"
                            className="h-full w-full object-cover"
                          /> */}
                          {profilePicture(user)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        className="group flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        Account
                      </Link>
                      <Link
                        to="/settings"
                        className="group flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        Settings
                      </Link>
                      {user && (
                        <Link
                          to="/subscription"
                          className="group flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <Sparkles className="h-4 w-4 text-amber-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                          Pro Subscription
                        </Link>
                      )}
                    </div>

                    <div className="py-1 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => {
                          /* Handle logout */
                          authStore.logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Sign out
                      </button>
                    </div>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/login"
              className={cn(
                "hidden md:inline-block px-4 py-2 rounded-lg text-sm font-medium text-gray-700  transition-all duration-200",
                className
              )}
            >
              Log in
            </Link>
            {/* dark:!text-gray-200 hover:!text-indigo-600 dark:hover:!text-indigo-400 hover:bg-gray-50 da!rk:hover:!bg-gray-800/50 */}
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:!from-indigo-700 hover:!to-purple-700 shadow-sm hover:!shadow transition-all duration-200"
            >
              Get started
            </Link>
          </div>
        )}
      </>
    );
  }
);

export default AuthMenu;

function profilePicture(user: AuthUser) {
  return (
    <Avatar className="h-full w-full object-cover flex-shrink-0  rounded-full">
      <AvatarImage
        // src={"https://randomuser.me/api/portraits/women/24.jpg"}
        src={user.photoURL || ""}
      />
      <AvatarFallback
        style={{
          backgroundColor: generateColorFromText(
            authStore.fallbackName?.toUpperCase()
          ),
        }}
        className="flex items-center justify-center w-full h-full font-medium uppercase"
      >
        {authStore.fallbackName}
      </AvatarFallback>
    </Avatar>
  );
}
