import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight } from "lucide-react";
import { featuresMenuData, resourcesMenuData, solutionCards } from "./data";
import {
  NavbarBetaTag,
  NavbarHotTag,
  NavbarNewTag,
  NavbarProTag,
} from "./components";

type Props = {
  activeMenu: string | null;
  toggleMenu: (menu: string) => void;
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
};

const MobileMenuOverlay = ({
  activeMenu,
  toggleMenu,
  isMobileMenuOpen,
}: Props) => {
  const controls = useAnimation();
  const [menuPosition] = useState("right");

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      controls.start("visible");
    } else {
      document.body.style.overflow = "";
      controls.start("hidden");
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, controls]);

  // Advanced animation variants
  const menuVariants = {
    hidden: {
      opacity: 0,
      x: menuPosition === "right" ? 40 : -40,
      transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 15 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1],
      },
    }),
  };

  const overlayVariants = {
    hidden: { scaleY: 0, originY: 0 },
    visible: {
      scaleY: 1,
      transition: {
        duration: 0.3,
        ease: [0.33, 1, 0.68, 1],
        when: "beforeChildren",
      },
    },
  };

  const menuHeaderVariants = {
    rest: { backgroundColor: "rgba(255, 255, 255, 0)" },
    hover: { backgroundColor: "rgba(249, 250, 251, 0.6)" },
  };

  function renderMenuHeader(title: string, menuName: string) {
    return (
      <motion.button
        onClick={() => toggleMenu(menuName)}
        className="w-full flex items-center justify-between py-4 px-5 rounded-xl text-base font-medium text-gray-800 dark:text-gray-100 transition-all duration-300"
        variants={menuHeaderVariants}
        initial="rest"
        whileHover="hover"
        transition={{ duration: 0.2 }}
      >
        <span className="text-base tracking-wide font-semibold">{title}</span>
        <motion.div
          animate={{
            rotate: activeMenu === menuName ? 90 : 0,
            color: activeMenu === menuName ? "#4f46e5" : "#6b7280",
          }}
          transition={{ duration: 0.2, ease: "anticipate" }}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.div>
      </motion.button>
    );
  }

  function renderResourcesMenu() {
    return (
      <div className="py-1">
        {renderMenuHeader("Resources", "resources-mobile")}

        <AnimatePresence>
          {activeMenu === "resources-mobile" && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-xl mx-3 mb-3"
            >
              {resourcesMenuData.map((section) => (
                <div key={section.title} className="py-3 px-4">
                  <h3 className="px-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        variants={itemVariants}
                        custom={idx}
                      >
                        <Link
                          to={item.path}
                          className="flex items-center py-3 px-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300"
                        >
                          <div className="mr-3 text-indigo-600 dark:text-indigo-400">
                            {item.icon}
                          </div>
                          <span className="font-medium">{item.title}</span>
                          <div className="ml-auto flex gap-2">
                            {item.isNew && <NavbarNewTag />}
                            {item.isPro && <NavbarProTag />}
                            {item.isBeta && <NavbarBetaTag />}
                            {item.isHot && <NavbarHotTag />}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function renderSolutionsMenu() {
    return (
      <div className="py-1">
        {renderMenuHeader("Solutions", "solutions-mobile")}

        <AnimatePresence>
          {activeMenu === "solutions-mobile" && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden mx-3 mb-3"
            >
              <div className="grid gap-2 px-1 py-1">
                {solutionCards.map((solution, idx) => (
                  <motion.div key={idx} variants={itemVariants} custom={idx}>
                    <Link
                      to={solution.path}
                      className="block rounded-xl p-4 hover:bg-white dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-800 transition-all duration-300 group"
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-3 rounded-xl bg-${solution.color}-100 dark:bg-${solution.color}-900/50 mr-4 flex items-center justify-center`}
                        >
                          {solution.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                              {solution.title}
                            </h4>
                            {solution.isNew && (
                              <span className="ml-2">
                                <NavbarNewTag />
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed pr-2">
                            {solution.description}
                          </p>
                        </div>
                        <motion.div
                          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function renderFeaturesMenu() {
    return (
      <div className="py-1">
        {renderMenuHeader("Features", "features-mobile")}

        <AnimatePresence>
          {activeMenu === "features-mobile" && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-xl mx-3 mb-3"
            >
              {featuresMenuData.map((section, sIndex) => (
                <div key={section.title} className="py-3 px-4">
                  <h3 className="px-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        variants={itemVariants}
                        custom={idx}
                      >
                        <Link
                          to={item.path}
                          className="flex items-center py-3 px-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300"
                        >
                          <div className="mr-3 text-indigo-600 dark:text-indigo-400">
                            {item.icon}
                          </div>
                          <span className="font-medium">{item.title}</span>
                          <div className="ml-auto flex gap-2">
                            {item.isNew && <NavbarNewTag />}
                            {item.isPro && <NavbarProTag />}
                            {item.isBeta && <NavbarBetaTag />}
                            {item.isHot && <NavbarHotTag />}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm z-40"
            onClick={closeMobileMenu}
          /> */}
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate={controls}
            exit="hidden"
            className="lg:hidden top-0 bottom-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
          >
            {/* <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Menu
              </h2>
              <motion.button
                onClick={closeMobileMenu}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div> */}

            <div className="flex-1 py-3 overflow-y-auto overscroll-contain">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {renderFeaturesMenu()}
                {renderSolutionsMenu()}
                {renderResourcesMenu()}
              </div>
            </div>

            {/* Auth section */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  Log in
                </Link>
                <motion.div whileHover="hover" className="relative">
                  <Link
                    to="/signup"
                    className="flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md transition-all duration-300 relative z-10 overflow-hidden group"
                  >
                    <span className="mr-2">Get started</span>
                    <motion.div
                      className="inline-block"
                      animate={{ x: [0, 3, 0] }}
                      transition={{
                        duration: 1.2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-violet-600/40 to-transparent z-0"
                      animate={{
                        x: ["0%", "100%"],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Footer navigation with nice subtle design */}
            <div className="p-5 bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/pricing"
                  className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-white dark:hover:bg-gray-800/70 transition-all duration-200"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-white dark:hover:bg-gray-800/70 transition-all duration-200"
                >
                  About
                </Link>
                <Link
                  to="/blog"
                  className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-white dark:hover:bg-gray-800/70 transition-all duration-200"
                >
                  Blog
                </Link>
                <Link
                  to="/contact"
                  className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-white dark:hover:bg-gray-800/70 transition-all duration-200"
                >
                  Contact
                </Link>
              </div>
              <div className="mt-4 flex items-center space-x-3 justify-center">
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuOverlay;
