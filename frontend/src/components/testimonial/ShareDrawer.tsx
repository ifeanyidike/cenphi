import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../repo/workspace_hub";
import Button from "./UI/Button";
import { SharingPlatform, Testimonial } from "@/types/testimonial";

interface ShareDrawerProps {
  onClose: () => void;
  testimonial: Testimonial | null;
}

const ShareDrawer: React.FC<ShareDrawerProps> = observer(
  ({ onClose, testimonial }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // State management
    const [selectedPlatform, setSelectedPlatform] =
      useState<SharingPlatform | null>(null);
    const [customizations, setCustomizations] = useState({
      includeRating: true,
      includeAuthor: true,
      includeCompany: true,
      darkMode: isDarkMode,
      showBorder: true,
      animate: true,
      responsive: true,
    });
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "tablet">(
      "desktop"
    );
    const [isPrimaryLoading, setIsPrimaryLoading] = useState(false);

    // Update darkMode customization when app theme changes
    useEffect(() => {
      setCustomizations((prev) => ({
        ...prev,
        darkMode: isDarkMode,
      }));
    }, [isDarkMode]);

    // Platforms data with modern, minimal icons
    const platforms = [
      {
        id: SharingPlatform.WEBSITE,
        name: "Website",
        description: "Embed on your website with a customizable widget",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M8 21h8"></path>
            <path d="M12 17v4"></path>
          </svg>
        ),
        color: "from-blue-500 to-indigo-600",
        bgLight: "bg-blue-50",
        bgDark: "bg-blue-900/20",
        borderLight: "border-blue-100",
        borderDark: "border-blue-800/30",
        textLight: "text-blue-700",
        textDark: "text-blue-300",
      },
      {
        id: SharingPlatform.FACEBOOK,
        name: "Facebook",
        description: "Share your testimonial directly to Facebook",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        ),
        color: "from-blue-600 to-blue-700",
        bgLight: "bg-blue-50",
        bgDark: "bg-blue-900/20",
        borderLight: "border-blue-100",
        borderDark: "border-blue-800/30",
        textLight: "text-blue-700",
        textDark: "text-blue-300",
      },
      {
        id: SharingPlatform.TWITTER,
        name: "Twitter",
        description: "Tweet your testimonial to your followers",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
          </svg>
        ),
        color: "from-sky-500 to-sky-600",
        bgLight: "bg-sky-50",
        bgDark: "bg-sky-900/20",
        borderLight: "border-sky-100",
        borderDark: "border-sky-800/30",
        textLight: "text-sky-700",
        textDark: "text-sky-300",
      },
      {
        id: SharingPlatform.LINKEDIN,
        name: "LinkedIn",
        description: "Share professionally with your LinkedIn network",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
        ),
        color: "from-blue-700 to-blue-800",
        bgLight: "bg-blue-50",
        bgDark: "bg-blue-900/20",
        borderLight: "border-blue-100",
        borderDark: "border-blue-800/30",
        textLight: "text-blue-700",
        textDark: "text-blue-300",
      },
      {
        id: SharingPlatform.INSTAGRAM,
        name: "Instagram",
        description: "Create a visual story for Instagram",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        ),
        color: "from-purple-500 to-pink-600",
        bgLight: "bg-purple-50",
        bgDark: "bg-purple-900/20",
        borderLight: "border-purple-100",
        borderDark: "border-purple-800/30",
        textLight: "text-purple-700",
        textDark: "text-purple-300",
      },
      {
        id: SharingPlatform.EMAIL,
        name: "Email",
        description: "Send via email to your contacts or prospects",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        ),
        color: "from-amber-500 to-amber-600",
        bgLight: "bg-amber-50",
        bgDark: "bg-amber-900/20",
        borderLight: "border-amber-100",
        borderDark: "border-amber-800/30",
        textLight: "text-amber-700",
        textDark: "text-amber-300",
      },
      {
        id: SharingPlatform.EMBED,
        name: "Embed Code",
        description: "Get the code to embed on any website",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        ),
        color: "from-slate-500 to-slate-700",
        bgLight: "bg-slate-50",
        bgDark: "bg-slate-800/40",
        borderLight: "border-slate-200",
        borderDark: "border-slate-700",
        textLight: "text-slate-700",
        textDark: "text-slate-300",
      },
      {
        id: SharingPlatform.DOWNLOAD,
        name: "Download",
        description: "Download as image, video, or document",
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        ),
        color: "from-emerald-500 to-emerald-600",
        bgLight: "bg-emerald-50",
        bgDark: "bg-emerald-900/20",
        borderLight: "border-emerald-100",
        borderDark: "border-emerald-800/30",
        textLight: "text-emerald-700",
        textDark: "text-emerald-300",
      },
    ];

    const getFormattedContent = (testimonial: Testimonial | null): string => {
      if (!testimonial) return "";

      switch (testimonial.format) {
        case "text":
        case "image":
          return testimonial.content || "";
        case "video":
        case "audio":
          return testimonial.transcript || "";

        default:
          return "";
      }
    };

    const truncateContent = (content: string, length: number = 120): string => {
      if (content.length <= length) return content;
      return content.substring(0, length) + "...";
    };

    const handleCopyEmbedCode = () => {
      if (!testimonial) return;

      const code = generateEmbedCode();
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const toggleCustomization = (key: keyof typeof customizations) => {
      setCustomizations({
        ...customizations,
        [key]: !customizations[key],
      });
    };

    const handlePreviewToggle = () => {
      setShowPreview(!showPreview);
    };

    const handleShareNow = () => {
      if (!selectedPlatform) return;

      setIsPrimaryLoading(true);

      // Simulate share action
      setTimeout(() => {
        // Update testimonial shares count
        if (testimonial && workspaceHub.testimonialManager.testimonial) {
          workspaceHub.testimonialManager.testimonial = {
            ...workspaceHub.testimonialManager.testimonial,
            custom_fields: {
              ...workspaceHub.testimonialManager.testimonial.custom_fields,
              shares:
                ((workspaceHub.testimonialManager.testimonial.custom_fields
                  ?.shares as number) || 0) + 1,
            },
          };
        }

        setIsPrimaryLoading(false);
        onClose();
      }, 1500);
    };

    const generateEmbedCode = (): string => {
      if (!testimonial) return "";

      return `<div 
  data-testimonial-id="${testimonial.id || "testimonial-id"}" 
  class="testimonial-widget" 
  data-include-rating="${customizations.includeRating}"
  data-include-author="${customizations.includeAuthor}"
  data-include-company="${customizations.includeCompany}"
  data-dark-mode="${customizations.darkMode}"
  data-show-border="${customizations.showBorder}"
  data-animate="${customizations.animate}"
  data-responsive="${customizations.responsive}"
>
</div>
<script src="https://cdn.yourdomain.com/testimonial-widget.js"></script>`;
    };

    // Define current platform
    const currentPlatform = platforms.find((p) => p.id === selectedPlatform);

    // Animation variants with refined motion
    const drawerVariants: Variants = {
      hidden: {
        x: "100%",
        opacity: 0.5,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 40,
        },
      },
      visible: {
        x: 0,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          staggerChildren: 0.04,
          delayChildren: 0.05,
        },
      },
      exit: {
        x: "100%",
        opacity: 0.5,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 40,
          staggerChildren: 0.02,
          staggerDirection: -1,
        },
      },
    };

    const itemVariants: Variants = {
      hidden: { x: 15, opacity: 0 },
      visible: {
        x: 0,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
        },
      },
      exit: { x: 15, opacity: 0 },
    };

    const overlayVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.2,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.15,
        },
      },
    };

    const fadeVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.3,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.2,
        },
      },
    };

    return (
      <>
        {/* Custom scrollbar styles */}
        <style>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 9999px;
          }
        `}</style>

        {/* Backdrop overlay with subtle blur effect */}
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        />

        {/* Main drawer panel */}
        <motion.div
          className={`fixed top-0 right-0 bottom-0 w-full md:w-[600px] xl:w-[650px] z-50 shadow-2xl flex flex-col ${
            isDarkMode
              ? "bg-slate-900 text-white border-l border-slate-800"
              : "bg-white text-slate-900 border-l border-slate-200"
          }`}
          variants={drawerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header with gradient accent */}
          <motion.div
            className="relative flex items-center justify-between p-6"
            variants={itemVariants}
          >
            {/* Subtle gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

            <div className="flex items-center gap-4">
              <div
                className={`rounded-xl p-2 ${
                  isDarkMode
                    ? "bg-indigo-900/30 text-indigo-300"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Share Testimonial</h2>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode
                  ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                  : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
              }`}
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>

          {/* Main content area with smooth scrolling */}
          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {/* Platform selection section */}
            <motion.div
              className={`px-6 py-5 ${
                isDarkMode
                  ? "border-b border-slate-800"
                  : "border-b border-slate-200"
              }`}
              variants={itemVariants}
            >
              <h3
                className={`text-base font-medium mb-4 ${
                  isDarkMode ? "text-slate-200" : "text-slate-700"
                }`}
              >
                Choose Sharing Platform
              </h3>

              <div className="grid grid-cols-4 gap-3">
                {platforms.map((platform) => (
                  <motion.button
                    key={platform.id}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${
                      selectedPlatform === platform.id
                        ? isDarkMode
                          ? `bg-gradient-to-br ${platform.color} text-white shadow-md border-transparent`
                          : `bg-gradient-to-br ${platform.color} text-white shadow-md border-transparent`
                        : isDarkMode
                          ? `bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300`
                          : `bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600`
                    }`}
                    onClick={() => setSelectedPlatform(platform.id)}
                    aria-label={`Share on ${platform.name}`}
                  >
                    <div
                      className={`${
                        selectedPlatform === platform.id
                          ? "text-white"
                          : isDarkMode
                            ? "text-slate-300"
                            : "text-slate-500"
                      }`}
                    >
                      {platform.icon}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        selectedPlatform === platform.id
                          ? "text-white"
                          : isDarkMode
                            ? "text-slate-300"
                            : "text-slate-600"
                      }`}
                    >
                      {platform.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Platform-specific content */}
            <AnimatePresence mode="wait">
              {selectedPlatform && (
                <motion.div
                  key={`platform-${selectedPlatform}`}
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`px-6 py-5 ${
                    isDarkMode
                      ? "border-b border-slate-800"
                      : "border-b border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3
                        className={`text-base font-medium flex items-center ${
                          isDarkMode ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        {currentPlatform?.name} Preview
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {currentPlatform?.description}
                      </p>
                    </div>

                    <button
                      onClick={handlePreviewToggle}
                      className={`text-xs font-medium flex items-center space-x-1 px-3 py-1.5 rounded-lg ${
                        isDarkMode
                          ? "text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/20"
                          : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      }`}
                    >
                      <span>
                        {showPreview ? "Hide Preview" : "Show Preview"}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-300 ${showPreview ? "rotate-180" : "rotate-0"}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>

                  {/* Preview section */}
                  <AnimatePresence>
                    {showPreview && testimonial && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        {/* Responsive view toggle for website/embed */}
                        {(selectedPlatform === SharingPlatform.WEBSITE ||
                          selectedPlatform === SharingPlatform.EMBED) && (
                          <div
                            className={`flex justify-center mb-4 p-2 rounded-lg ${
                              isDarkMode ? "bg-slate-800/60" : "bg-slate-100/60"
                            }`}
                          >
                            <div className="inline-flex rounded-lg p-1 text-xs">
                              <button
                                onClick={() => setViewMode("desktop")}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                                  viewMode === "desktop"
                                    ? isDarkMode
                                      ? "bg-slate-700 text-white"
                                      : "bg-white text-slate-800 shadow-sm"
                                    : isDarkMode
                                      ? "text-slate-400 hover:text-slate-200"
                                      : "text-slate-600 hover:text-slate-800"
                                }`}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="2"
                                    y="3"
                                    width="20"
                                    height="14"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line x1="8" y1="21" x2="16" y2="21"></line>
                                  <line x1="12" y1="17" x2="12" y2="21"></line>
                                </svg>
                                <span>Desktop</span>
                              </button>
                              <button
                                onClick={() => setViewMode("tablet")}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                                  viewMode === "tablet"
                                    ? isDarkMode
                                      ? "bg-slate-700 text-white"
                                      : "bg-white text-slate-800 shadow-sm"
                                    : isDarkMode
                                      ? "text-slate-400 hover:text-slate-200"
                                      : "text-slate-600 hover:text-slate-800"
                                }`}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="4"
                                    y="2"
                                    width="16"
                                    height="20"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line
                                    x1="12"
                                    y1="18"
                                    x2="12.01"
                                    y2="18"
                                  ></line>
                                </svg>
                                <span>Tablet</span>
                              </button>
                              <button
                                onClick={() => setViewMode("mobile")}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                                  viewMode === "mobile"
                                    ? isDarkMode
                                      ? "bg-slate-700 text-white"
                                      : "bg-white text-slate-800 shadow-sm"
                                    : isDarkMode
                                      ? "text-slate-400 hover:text-slate-200"
                                      : "text-slate-600 hover:text-slate-800"
                                }`}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="5"
                                    y="2"
                                    width="14"
                                    height="20"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line
                                    x1="12"
                                    y1="18"
                                    x2="12.01"
                                    y2="18"
                                  ></line>
                                </svg>
                                <span>Mobile</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Preview container with responsive simulation */}
                        <div
                          className={`flex justify-center mb-6 ${
                            viewMode === "desktop"
                              ? "max-w-none"
                              : viewMode === "tablet"
                                ? "max-w-md mx-auto"
                                : "max-w-xs mx-auto"
                          }`}
                        >
                          <div
                            className={`relative ${
                              customizations.showBorder ? "border" : "border-0"
                            } ${
                              customizations.darkMode
                                ? "bg-slate-800 border-slate-700"
                                : "bg-white border-slate-200"
                            } rounded-lg overflow-hidden w-full ${
                              customizations.showBorder ? "p-4" : "p-0"
                            } ${
                              viewMode === "mobile" ? "shadow-lg" : "shadow-md"
                            }`}
                          >
                            {/* Browser frame for desktop */}
                            {viewMode === "desktop" && (
                              <div
                                className={`h-6 flex items-center ${
                                  customizations.darkMode
                                    ? "bg-slate-700"
                                    : "bg-slate-100"
                                } rounded-t-lg mb-2 px-2 relative -mx-4 -mt-4 ${
                                  customizations.showBorder ? "" : "hidden"
                                }`}
                              >
                                <div className="flex space-x-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                </div>
                              </div>
                            )}

                            {/* Mobile/tablet frame */}
                            {viewMode !== "desktop" &&
                              customizations.showBorder && (
                                <div
                                  className={`h-4 flex justify-center items-center ${
                                    customizations.darkMode
                                      ? "bg-slate-700"
                                      : "bg-slate-100"
                                  } rounded-t-lg mb-2 -mx-4 -mt-4 relative`}
                                >
                                  <div className="w-16 h-1.5 rounded-full bg-slate-400"></div>
                                </div>
                              )}

                            {/* Testimonial preview content */}
                            <div className="flex items-start gap-3">
                              {testimonial.customer_profile?.avatar_url &&
                                customizations.includeAuthor && (
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={
                                        testimonial.customer_profile.avatar_url
                                      }
                                      alt={testimonial.customer_profile.name}
                                      className="w-12 h-12 rounded-full object-cover shadow-sm border"
                                      style={{
                                        borderColor: customizations.darkMode
                                          ? "rgba(51, 65, 85, 0.5)"
                                          : "rgba(241, 245, 249, 0.5)",
                                      }}
                                    />
                                  </div>
                                )}

                              <div className="flex-1 min-w-0">
                                {customizations.includeRating &&
                                  testimonial.rating && (
                                    <div className="flex items-center mb-2">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < testimonial.rating!
                                              ? "text-amber-400"
                                              : customizations.darkMode
                                                ? "text-slate-700"
                                                : "text-slate-300"
                                          }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                      <span
                                        className={`ml-2 text-xs ${
                                          customizations.darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                        }`}
                                      >
                                        {testimonial.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}

                                <p
                                  className={`text-sm mb-3 ${
                                    customizations.darkMode
                                      ? "text-slate-300"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {truncateContent(
                                    getFormattedContent(testimonial)
                                  )}
                                </p>

                                {customizations.includeAuthor && (
                                  <div>
                                    <p
                                      className={`text-sm font-medium ${
                                        customizations.darkMode
                                          ? "text-white"
                                          : "text-slate-900"
                                      }`}
                                    >
                                      {testimonial.customer_profile?.name}
                                    </p>

                                    {customizations.includeCompany &&
                                      (testimonial.customer_profile?.title ||
                                        testimonial.customer_profile
                                          ?.company) && (
                                        <p
                                          className={`text-xs ${
                                            customizations.darkMode
                                              ? "text-slate-400"
                                              : "text-slate-600"
                                          }`}
                                        >
                                          {testimonial.customer_profile?.title}
                                          {testimonial.customer_profile
                                            ?.title &&
                                            testimonial.customer_profile
                                              ?.company &&
                                            ", "}
                                          {
                                            testimonial.customer_profile
                                              ?.company
                                          }
                                        </p>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Animation indicator if enabled */}
                            {customizations.animate && (
                              <div
                                className={`absolute bottom-2 right-2 flex items-center text-xs ${
                                  customizations.darkMode
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                }`}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path>
                                  <polygon points="12 15 17 21 7 21 12 15"></polygon>
                                </svg>
                                <span className="ml-1">Animated</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Platform-specific customization options */}
                  {(selectedPlatform === SharingPlatform.WEBSITE ||
                    selectedPlatform === SharingPlatform.EMBED) && (
                    <div className="mt-5">
                      <h4
                        className={`text-sm font-medium mb-3 ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Customize Appearance
                      </h4>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`relative w-3.5 h-6 flex items-center ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            } rounded-full transition-colors duration-200 ease-in-out ${
                              customizations.includeRating
                                ? isDarkMode
                                  ? "bg-indigo-600"
                                  : "bg-indigo-600"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 inline-block h-5 w-2.5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
                                customizations.includeRating
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                            <input
                              type="checkbox"
                              id="includeRating"
                              checked={customizations.includeRating}
                              onChange={() =>
                                toggleCustomization("includeRating")
                              }
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <label
                            htmlFor="includeRating"
                            className={`text-sm cursor-pointer ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Show Rating
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`relative w-3.5 h-6 flex items-center ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            } rounded-full transition-colors duration-200 ease-in-out ${
                              customizations.includeAuthor
                                ? isDarkMode
                                  ? "bg-indigo-600"
                                  : "bg-indigo-600"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 inline-block h-5 w-2.5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
                                customizations.includeAuthor
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                            <input
                              type="checkbox"
                              id="includeAuthor"
                              checked={customizations.includeAuthor}
                              onChange={() =>
                                toggleCustomization("includeAuthor")
                              }
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <label
                            htmlFor="includeAuthor"
                            className={`text-sm cursor-pointer ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Show Author
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`relative w-3.5 h-6 flex items-center ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            } rounded-full transition-colors duration-200 ease-in-out ${
                              customizations.includeCompany
                                ? isDarkMode
                                  ? "bg-indigo-600"
                                  : "bg-indigo-600"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 inline-block h-5 w-2.5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
                                customizations.includeCompany
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                            <input
                              type="checkbox"
                              id="includeCompany"
                              checked={customizations.includeCompany}
                              onChange={() =>
                                toggleCustomization("includeCompany")
                              }
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <label
                            htmlFor="includeCompany"
                            className={`text-sm cursor-pointer ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Show Company
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`relative w-3.5 h-6 flex items-center ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            } rounded-full transition-colors duration-200 ease-in-out ${
                              customizations.darkMode
                                ? isDarkMode
                                  ? "bg-indigo-600"
                                  : "bg-indigo-600"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 inline-block h-5 w-2.5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
                                customizations.darkMode
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                            <input
                              type="checkbox"
                              id="darkMode"
                              checked={customizations.darkMode}
                              onChange={() => toggleCustomization("darkMode")}
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <label
                            htmlFor="darkMode"
                            className={`text-sm cursor-pointer ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Dark Mode
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`relative w-3.5 h-6 flex items-center ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            } rounded-full transition-colors duration-200 ease-in-out ${
                              customizations.showBorder
                                ? isDarkMode
                                  ? "bg-indigo-600"
                                  : "bg-indigo-600"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 inline-block h-5 w-2.5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
                                customizations.showBorder
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                            <input
                              type="checkbox"
                              id="showBorder"
                              checked={customizations.showBorder}
                              onChange={() => toggleCustomization("showBorder")}
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <label
                            htmlFor="showBorder"
                            className={`text-sm cursor-pointer ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Show Border
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`relative w-3.5 h-6 flex items-center ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            } rounded-full transition-colors duration-200 ease-in-out ${
                              customizations.animate
                                ? isDarkMode
                                  ? "bg-indigo-600"
                                  : "bg-indigo-600"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 inline-block h-5 w-2.5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
                                customizations.animate
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                            <input
                              type="checkbox"
                              id="animate"
                              checked={customizations.animate}
                              onChange={() => toggleCustomization("animate")}
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <label
                            htmlFor="animate"
                            className={`text-sm cursor-pointer ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Animation
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`relative w-3.5 h-6 flex items-center ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            } rounded-full transition-colors duration-200 ease-in-out ${
                              customizations.responsive
                                ? isDarkMode
                                  ? "bg-indigo-600"
                                  : "bg-indigo-600"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 inline-block h-5 w-2.5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
                                customizations.responsive
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                            <input
                              type="checkbox"
                              id="responsive"
                              checked={customizations.responsive}
                              onChange={() => toggleCustomization("responsive")}
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <label
                            htmlFor="responsive"
                            className={`text-sm cursor-pointer ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Responsive
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Embed code section */}
                  {(selectedPlatform === SharingPlatform.WEBSITE ||
                    selectedPlatform === SharingPlatform.EMBED) && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          Embed Code
                        </h4>
                        <button
                          onClick={handleCopyEmbedCode}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                            copied
                              ? isDarkMode
                                ? "bg-green-900/30 text-green-300"
                                : "bg-green-100 text-green-700"
                              : isDarkMode
                                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {copied ? (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div
                        className={`p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre ${
                          isDarkMode
                            ? "bg-slate-800 text-slate-300 border border-slate-700"
                            : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <pre className="whitespace-pre-wrap">
                          {generateEmbedCode()}
                        </pre>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sharing statistics section */}
            <motion.div className="px-6 py-5" variants={itemVariants}>
              <h3
                className={`text-base font-medium mb-4 ${
                  isDarkMode ? "text-slate-200" : "text-slate-700"
                }`}
              >
                Sharing Statistics
              </h3>

              <div
                className={`p-5 rounded-xl border ${
                  isDarkMode
                    ? "bg-slate-800/60 border-slate-700"
                    : "bg-slate-50/80 border-slate-200"
                }`}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div
                      className={`text-2xl font-bold mb-1 ${
                        isDarkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {testimonial?.view_count?.toLocaleString() || "0"}
                    </div>
                    <div className="flex items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`mr-1 ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Total Views
                      </p>
                    </div>
                  </div>

                  <div>
                    <div
                      className={`text-2xl font-bold mb-1 ${
                        isDarkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {testimonial?.share_count?.toLocaleString() || "0"}
                    </div>
                    <div className="flex items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`mr-1 ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Total Shares
                      </p>
                    </div>
                  </div>

                  <div>
                    <div
                      className={`text-2xl font-bold mb-1 ${
                        isDarkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {testimonial && testimonial.view_count > 0
                        ? (
                            (testimonial.share_count / testimonial.view_count) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </div>
                    <div className="flex items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`mr-1 ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Share Rate
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional engagement metrics */}
                <div className="mt-5 pt-4 border-t border-dashed grid grid-cols-2 gap-4">
                  <div
                    className={`rounded-lg p-3 ${
                      isDarkMode ? "bg-slate-800" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Engagement Score
                      </div>
                      <div
                        className={`flex items-center px-2 py-0.5 rounded-md text-xs ${
                          isDarkMode
                            ? "bg-indigo-900/30 text-indigo-300"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        High
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: "87%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg p-3 ${
                      isDarkMode ? "bg-slate-800" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Recent Trend
                      </div>
                      <div
                        className={`flex items-center px-2 py-0.5 rounded-md text-xs ${
                          isDarkMode
                            ? "bg-green-900/30 text-green-300"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-0.5"
                        >
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                        24%
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-1 h-5">
                      <div
                        className={`rounded-sm ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
                        style={{ height: "30%" }}
                      ></div>
                      <div
                        className={`rounded-sm ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
                        style={{ height: "50%" }}
                      ></div>
                      <div
                        className={`rounded-sm ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
                        style={{ height: "35%" }}
                      ></div>
                      <div
                        className={`rounded-sm ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
                        style={{ height: "60%" }}
                      ></div>
                      <div
                        className={`rounded-sm ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
                        style={{ height: "40%" }}
                      ></div>
                      <div
                        className={`rounded-sm ${isDarkMode ? "bg-indigo-600" : "bg-indigo-500"}`}
                        style={{ height: "75%" }}
                      ></div>
                      <div
                        className={`rounded-sm ${isDarkMode ? "bg-indigo-600" : "bg-indigo-500"}`}
                        style={{ height: "90%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer with action buttons */}
          <motion.div
            className={`relative p-6 flex justify-between items-center border-t ${
              isDarkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
            variants={itemVariants}
          >
            <Button
              variant="ghost"
              onClick={onClose}
              className={
                isDarkMode
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-slate-100"
              }
            >
              Cancel
            </Button>

            <Button
              variant={selectedPlatform ? "primary" : "outline"}
              disabled={!selectedPlatform}
              isLoading={isPrimaryLoading}
              // loadingText="Sharing..."
              onClick={handleShareNow}
              className="px-8"
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              }
            >
              {isPrimaryLoading ? "Sharing..." : "Share Now"}
            </Button>
          </motion.div>
        </motion.div>
      </>
    );
  }
);

export default ShareDrawer;
