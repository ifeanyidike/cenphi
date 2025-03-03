import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";
import { megaMenuVariants, menuItemVariants, resourcesMenuData } from "./data";
import {
  GlassPanel,
  NavbarBetaTag,
  NavbarNewTag,
  NavbarProTag,
} from "./components";
import { cn } from "@/lib/utils";

type Props = {
  isActive: boolean;
  toggleMenu: (menu: string) => void;
  className?: string;
};
const ResourcesMenu = ({ className, isActive, toggleMenu }: Props) => {
  return (
    <div className="relative">
      <button
        onClick={() => toggleMenu("resources")}
        className={cn(
          "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",

          isActive
            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:!text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50",
          !isActive && className
        )}
      >
        Resources
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
            className="absolute left-0 mt-2 w-screen max-w-4xl rounded-xl overflow-hidden z-50"
          >
            <GlassPanel className="border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="grid grid-cols-2 gap-0">
                {resourcesMenuData.map((section, idx) => (
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
                          className="group flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
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

              <div className="relative overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 px-6 py-5 flex justify-between items-center rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Free resource: The Ultimate Guide to Social Proof
                    </p>
                    <p className="text-sm text-indigo-100">
                      Download our 28-page playbook on maximizing testimonial
                      impact
                    </p>
                  </div>
                  <Link
                    to="/resources/playbook"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                  >
                    Get free guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Animated background elements */}
                <motion.div
                  className="absolute top-0 right-0 h-full w-1/3 opacity-10 pointer-events-none"
                  initial={{ rotate: 0 }}
                  animate={{
                    rotate: 360,
                    transition: {
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                    <path
                      fill="white"
                      d="M45.3,-52.9C60.9,-40.9,77,-28.5,81.2,-13.1C85.4,2.3,77.8,20.6,66.7,34.9C55.6,49.2,41,59.5,24.6,66.5C8.2,73.5,-10,77.3,-27.4,73.2C-44.9,69.1,-61.6,57.1,-70.9,41.1C-80.1,25.1,-81.9,5,-75.7,-11.2C-69.6,-27.3,-55.4,-39.6,-41.1,-51.8C-26.8,-64,-13.4,-76.2,0.6,-76.9C14.6,-77.7,29.8,-65,45.3,-52.9Z"
                      transform="translate(100 100)"
                    />
                  </svg>
                </motion.div>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourcesMenu;
