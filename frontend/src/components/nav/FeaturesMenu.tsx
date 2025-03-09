import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown, Play } from "lucide-react";
import {
  GlassPanel,
  NavbarBetaTag,
  NavbarHotTag,
  NavbarNewTag,
  NavbarProTag,
} from "./components";
import { featuresMenuData, megaMenuVariants, menuItemVariants } from "./data";
import { cn } from "@/lib/utils";

type Props = {
  isActive: boolean;
  toggleMenu: (menu: string) => void;
  className?: string;
};
const FeaturesMenu = (props: Props) => {
  const { className, isActive, toggleMenu } = props;
  return (
    <div className="relative">
      <button
        onClick={() => toggleMenu("features")}
        className={cn(
          "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:!text-indigo-600 dark:hover:!text-indigo-400 hover:bg-gray-50 dark:hover:!bg-gray-800/50",
          !isActive && className
        )}
      >
        Features
        <ChevronDown
          className={`ml-1 h-4 w-4 transition-transform duration-200 ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            variants={megaMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute left-0 mt-2 w-screen max-w-6xl rounded-xl overflow-hidden z-50"
          >
            <GlassPanel className="border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="grid grid-cols-2 gap-0">
                {featuresMenuData.map((section, idx) => (
                  <motion.div
                    key={idx}
                    variants={menuItemVariants}
                    className={`p-6 ${
                      idx === 0
                        ? "border-r border-gray-100 dark:border-gray-800"
                        : ""
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {section.items.map((item, itemIdx) => (
                        <Link
                          key={itemIdx}
                          to={item.path}
                          className="group flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                        >
                          <div className="flex-shrink-0 mt-1 transform transition-transform group-hover:scale-110">
                            {item.icon}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {item.title}
                              </h4>
                              <div className="flex gap-1.5 ml-2">
                                {item.isNew && <NavbarNewTag />}
                                {item.isPro && <NavbarProTag />}
                                {item.isHot && <NavbarHotTag />}
                                {item.isBeta && <NavbarBetaTag />}
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    Not sure where to start?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Check out our quick start guide
                  </p>
                </div>
                <Link
                  to="/demo"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                >
                  Watch demo
                  <Play className="h-4 w-4" />
                </Link>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeaturesMenu;
