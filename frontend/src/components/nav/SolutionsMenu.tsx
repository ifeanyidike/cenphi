import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { GlassPanel, NavbarNewTag } from "./components";
import { megaMenuVariants, menuItemVariants, solutionCards } from "./data";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  isActive: boolean;
  toggleMenu: (menu: string) => void;
};
const SolutionsMenu = ({ isActive, toggleMenu, className }: Props) => {
  return (
    <div className="relative">
      <button
        onClick={() => toggleMenu("solutions")}
        className={cn(
          "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",

          isActive
            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:!text-indigo-600 dark:hover:!text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50",
          !isActive && className
        )}
      >
        Solutions
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
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-2 w-screen max-w-4xl rounded-xl overflow-hidden z-50"
          >
            <GlassPanel className="border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-wider">
                  Industry Solutions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {solutionCards.map((solution, idx) => (
                    <motion.div
                      key={idx}
                      variants={menuItemVariants}
                      whileHover={{ scale: 1.02 }}
                      className={`group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-${solution.color}-500 dark:hover:border-${solution.color}-400 transition-all duration-300`}
                    >
                      <Link to={solution.path} className="block p-5">
                        <div className="flex justify-between items-start">
                          <div
                            className={`p-2 rounded-lg bg-${solution.color}-100 dark:bg-${solution.color}-900/20`}
                          >
                            {solution.icon}
                          </div>
                          {solution.isNew && <NavbarNewTag />}
                        </div>
                        <h4 className="mt-4 text-lg font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {solution.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {solution.description}
                        </p>
                        <div className="mt-4 flex justify-between items-center">
                          <span
                            className={`text-sm font-medium text-${solution.color}-600 dark:text-${solution.color}-400`}
                          >
                            {solution.stats}
                          </span>
                          <ArrowUpRight
                            className={`h-4 w-4 text-${solution.color}-500 dark:text-${solution.color}-400 opacity-0 group-hover:opacity-100 transform transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1`}
                          />
                        </div>

                        {/* Animated gradient border effect */}
                        <div className="absolute inset-0 border-2 border-transparent opacity-0 group-hover:opacity-10 rounded-xl overflow-hidden pointer-events-none">
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-gradient-x"
                            style={{
                              height: "200%",
                              width: "200%",
                              top: "-50%",
                              left: "-50%",
                            }}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    Need a custom solution?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Schedule a consultation with our experts
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                >
                  Talk to sales
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SolutionsMenu;
