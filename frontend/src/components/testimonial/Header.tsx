// components/Header.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../repo/workspace_hub";

interface HeaderProps {
  toggleShareDrawer: () => void;
  toggleWidgetDrawer: () => void;
}

const Header: React.FC<HeaderProps> = observer(
  ({ toggleShareDrawer, toggleWidgetDrawer }) => {
    const { uiManager, testimonialManager } = workspaceHub;
    const { isDarkMode, isFullscreen, toggleDarkMode, toggleFullscreen } =
      uiManager;
    const { testimonial } = testimonialManager;

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 ${
          isDarkMode
            ? "bg-slate-900/70 border-b border-slate-700/30"
            : "bg-white/70 border-b border-slate-200/30"
        } backdrop-blur-xl`}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Left section - Logo and title */}
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center mr-4 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-blue-400 to-violet-500"
                    : "bg-gradient-to-br from-blue-500 to-violet-600"
                }`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-2 0a6 6 0 11-12 0 6 6 0 0112 0zm-6-4a1 1 0 100 2 1 1 0 000-2zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-3 3a1 1 0 100 2 1 1 0 000-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>

              <div>
                <h1
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  {testimonial
                    ? `${testimonial.format.charAt(0).toUpperCase() + testimonial.format.slice(1)} Studio`
                    : "Testimonial Studio"}
                </h1>
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full ${isDarkMode ? "bg-emerald-400" : "bg-emerald-500"} mr-2`}
                  ></div>
                  <span
                    className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Pro Workspace
                  </span>
                </div>
              </div>
            </div>

            {/* Middle section - Search */}
            <motion.div
              animate={{ width: isSearchOpen ? 300 : 44 }}
              className={`flex items-center relative rounded-full ${
                isDarkMode
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-slate-100 border border-slate-200"
              }`}
            >
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`h-10 w-10 flex items-center justify-center rounded-full ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {isSearchOpen && (
                <input
                  type="text"
                  placeholder="Search testimonials..."
                  className={`bg-transparent border-none outline-none h-10 ${
                    isDarkMode
                      ? "text-white placeholder:text-slate-500"
                      : "text-slate-800 placeholder:text-slate-400"
                  }`}
                  autoFocus
                />
              )}
            </motion.div>

            {/* Right section - Actions */}
            <div className="flex items-center space-x-2">
              {testimonial && (
                <div
                  className={`hidden lg:flex items-center px-3 py-1.5 rounded-full ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="text-xs mr-2">ID:</span>
                  <span className="text-xs font-medium">{testimonial.id}</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                {/* Widget Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleWidgetDrawer}
                  className={`p-2 rounded-xl ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </motion.button>

                {/* Dark Mode Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-xl ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {isDarkMode ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </motion.button>

                {/* Fullscreen Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className={`p-2 rounded-xl ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {isFullscreen ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zm10 8a1 1 0 001-1V7a1 1 0 112 0v4a3 3 0 01-3 3h-4a1 1 0 110-2h4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </motion.button>
              </div>

              <div className="hidden sm:block mx-2 h-6 w-px bg-slate-300 dark:bg-slate-700"></div>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleShareDrawer}
                className={`px-4 py-2 rounded-xl ${
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                } shadow-lg hover:shadow-xl transition-shadow duration-200`}
              >
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  <span className="font-semibold">Share</span>
                </div>
              </motion.button>

              {/* User Profile */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="ml-2 flex items-center cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-500">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-2 hidden lg:block">
                  <p
                    className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Jane Smith
                  </p>
                  <p
                    className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Marketing Director
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>
    );
  }
);

export default Header;
