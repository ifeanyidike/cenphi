import React, { useState, useRef, FC, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence, useAnimation, Variants } from "framer-motion";
import { workspaceHub } from "../../repo/workspace_hub";

// Sidebar Props
type SidebarProps = {
  actionsRef: React.RefObject<HTMLDivElement | null>;
};

// Define animation variants
const sidebarVariants: Variants = {
  expanded: {
    width: "100%",
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  collapsed: {
    width: "84px",
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

const iconVariants: Variants = {
  expanded: {
    rotate: 0,
    transition: { duration: 0.4 },
  },
  collapsed: {
    rotate: 180,
    transition: { duration: 0.4 },
  },
};

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    },
  },
};

// Main Sidebar Component
const Sidebar: FC<SidebarProps> = observer(({ actionsRef }) => {
  // Store access
  const { testimonial } = workspaceHub.testimonialManager;
  const { sidebarMinimized } = workspaceHub.uiManager;

  console.log("sidebar minimized", sidebarMinimized);
  // Animation controls
  const buttonControls = useAnimation();

  // Local state
  const [isEditingAuthor, setIsEditingAuthor] = useState<boolean>(false);
  const [authorName, setAuthorName] = useState<string>(
    testimonial?.customer_profile?.name || ""
  );
  const [authorTitle, setAuthorTitle] = useState<string>(
    testimonial?.customer_profile?.title || ""
  );
  const [authorCompany, setAuthorCompany] = useState<string>(
    testimonial?.customer_profile?.company || ""
  );
  const [authorAvatar, setAuthorAvatar] = useState<string>(
    testimonial?.customer_profile?.avatar_url || ""
  );
  const [location, setLocation] = useState<string>(
    testimonial?.customer_profile?.location || ""
  );

  const [activeTab, setActiveTab] = useState<string>("author");

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null as unknown as HTMLInputElement);

  // Update author form when testimonial changes
  useEffect(() => {
    if (testimonial) {
      setAuthorName(testimonial.customer_profile?.name || "");
      setAuthorTitle(testimonial.customer_profile?.title || "");
      setAuthorCompany(testimonial.customer_profile?.company || "");
      setAuthorAvatar(testimonial.customer_profile?.avatar_url || "");
      setLocation(testimonial.customer_profile?.location || "");
    }
  }, [testimonial]);

  // Set focus to name input when editing begins
  useEffect(() => {
    if (isEditingAuthor && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingAuthor]);

  // Pulse animation for the toggle button
  useEffect(() => {
    if (!sidebarMinimized) {
      buttonControls.start("pulse");
    } else {
      buttonControls.stop();
    }
  }, [sidebarMinimized, buttonControls]);

  // Main component return
  return (
    <motion.div className="flex h-full w-full relative" ref={actionsRef}>
      {/* Main sidebar */}
      <motion.div
        className="h-full bg-gray-50 overflow-hidden rounded-xl shadow-sm border border-gray-200 relative"
        initial={false}
        animate={sidebarMinimized ? "collapsed" : "expanded"}
        variants={sidebarVariants}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-indigo-100 to-transparent rounded-full -mr-32 -mt-32 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-t from-purple-100 to-transparent rounded-full -ml-32 -mb-32 opacity-30"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(139,92,246,0.06),transparent_60%)]"></div>
        </div>

        <div className="relative h-full flex flex-col p-2">
          {/* <div
            className={`flex items-center mb-6 ${sidebarMinimized ? "justify-center" : "justify-between"}`}
          >
            {sidebarMinimized && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 8H17M7 12H11M7 16H15M3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div> */}

          {/* Sidebar content based on state */}
          <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
            {/* Collapsed state mini navigation */}
            {sidebarMinimized ? (
              <MiniNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            ) : (
              /* Expanded state content based on active tab */
              <>
                {testimonial ? (
                  activeTab === "stats" ? (
                    <StatsCard />
                  ) : testimonial.customer_profile ? (
                    <AuthorCard setIsEditingAuthor={setIsEditingAuthor} />
                  ) : (
                    <AddAuthorCard setIsEditingAuthor={setIsEditingAuthor} />
                  )
                ) : (
                  <AddAuthorCard setIsEditingAuthor={setIsEditingAuthor} />
                )}

                {/* Only show statistics if we have testimonial data and not on stats tab */}
                {testimonial && activeTab !== "stats" && <StatsCard />}
              </>
            )}
          </div>

          {/* Footer with export button */}
          {!sidebarMinimized && (
            <div className="pt-5 mt-auto">
              <motion.button
                whileHover={{
                  scale: 1.01,
                  boxShadow: "0 8px 16px -4px rgba(99, 102, 241, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))",
                  boxShadow: "0 4px 12px -2px rgba(99, 102, 241, 0.5)",
                }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 16.2422C2.79401 15.435 2 14.0602 2 12.5C2 10.1564 3.79151 8.23129 6.07974 8.01937C6.02733 7.68285 6.00024 7.34037 6.00024 6.99276C6.00024 3.68019 8.68869 1 12.0013 1C15.3138 1 18.0022 3.68019 18.0022 6.99276C18.0022 7.34037 17.9752 7.68285 17.9228 8.01937C20.211 8.23129 22.0025 10.1564 22.0025 12.5C22.0025 14.0603 21.2083 15.4352 20.0021 16.2424M8 17L12 21M12 21L16 17M12 21V12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export Testimonial
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Toggle button */}
      <motion.button
        animate={buttonControls}
        variants={pulseVariants}
        onClick={() => workspaceHub.uiManager.toggleSidebar()}
        className="self-center absolute top-1/2 -right-5 -ml-4 z-10 flex items-center justify-center w-10 h-16 bg-white rounded-r-lg shadow-md hover:shadow-lg border border-l-0 border-gray-200"
      >
        <motion.div
          initial={false}
          animate={sidebarMinimized ? "collapsed" : "expanded"}
          variants={iconVariants}
        >
          <svg
            className="w-5 h-5 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15 19L8 12L15 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.button>

      {/* Author form modal */}
      <AnimatePresence>
        {isEditingAuthor && (
          <AuthorFormModal
            authorAvatar={authorAvatar}
            authorCompany={authorCompany}
            authorName={authorName}
            authorTitle={authorTitle}
            location={location}
            nameInputRef={nameInputRef}
            setAuthorAvatar={setAuthorAvatar}
            setAuthorCompany={setAuthorCompany}
            setAuthorName={setAuthorName}
            setAuthorTitle={setAuthorTitle}
            setIsEditingAuthor={setIsEditingAuthor}
            setLocation={setLocation}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default Sidebar;

// Mini Navigation for collapsed state
type MiniNavigationProps = {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
};
const MiniNavigation: FC<MiniNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="flex flex-col items-center space-y-6 mt-4">
      <motion.button
        whileHover={{ y: -2, backgroundColor: "#eef2ff" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab("author")}
        className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
          activeTab === "author"
            ? "bg-indigo-100 text-indigo-600"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.90625 20.2491C3.82775 18.6531 5.1531 17.3278 6.74919 16.4064C8.34527 15.485 10.1568 15 12.0002 15C13.8436 15 15.6551 15.4851 17.2512 16.4065C18.8473 17.3279 20.1726 18.6533 21.0941 20.2494"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>

      <motion.button
        whileHover={{ y: -2, backgroundColor: "#eef2ff" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab("stats")}
        className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
          activeTab === "stats"
            ? "bg-indigo-100 text-indigo-600"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 8H17M3 18L3 8C3 5.23858 5.23858 3 8 3L16 3C18.7614 3 21 5.23858 21 8V18C21 20.7614 18.7614 23 16 23H8C5.23858 23 3 20.7614 3 18ZM12 7L8 13H16L12 7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>

      <motion.button
        whileHover={{ y: -2, backgroundColor: "#eef2ff" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab("export")}
        className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
          activeTab === "export"
            ? "bg-indigo-100 text-indigo-600"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16.2422C2.79401 15.435 2 14.0602 2 12.5C2 10.1564 3.79151 8.23129 6.07974 8.01937C6.02733 7.68285 6.00024 7.34037 6.00024 6.99276C6.00024 3.68019 8.68869 1 12.0013 1C15.3138 1 18.0022 3.68019 18.0022 6.99276C18.0022 7.34037 17.9752 7.68285 17.9228 8.01937C20.211 8.23129 22.0025 10.1564 22.0025 12.5C22.0025 14.0603 21.2083 15.4352 20.0021 16.2424M8 17L12 21M12 21L16 17M12 21V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    </div>
  );
};

// Premium Author Form Modal

type AuthorFormModalProps = {
  nameInputRef: React.RefObject<HTMLInputElement>;
  setIsEditingAuthor: React.Dispatch<React.SetStateAction<boolean>>;
  setAuthorName: React.Dispatch<React.SetStateAction<string>>;
  authorName: string;
  setAuthorTitle: React.Dispatch<React.SetStateAction<string>>;
  authorTitle: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  location: string;
  setAuthorAvatar: React.Dispatch<React.SetStateAction<string>>;
  authorAvatar: string;
  setAuthorCompany: React.Dispatch<React.SetStateAction<string>>;
  authorCompany: string;
};
const AuthorFormModal: FC<AuthorFormModalProps> = observer(
  ({
    nameInputRef,
    setIsEditingAuthor,
    setAuthorName,
    authorName,
    authorTitle,
    setAuthorTitle,
    location,
    setLocation,
    authorAvatar,
    setAuthorAvatar,
    setAuthorCompany,
    authorCompany,
  }) => {
    const { testimonial } = workspaceHub.testimonialManager;
    // Handle form submission
    const handleAuthorSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // Create the updated author object
      const updatedAuthor = {
        id: crypto.randomUUID().toString(),
        workspace_id: "",
        name: authorName,
        title: authorTitle || undefined,
        company: authorCompany || undefined,
        avatar_url: authorAvatar || undefined,
        location,
      };

      // Update the testimonial in the store
      workspaceHub.testimonialManager.testimonial = {
        ...workspaceHub.testimonialManager.testimonial!,
        customer_profile: { ...updatedAuthor },
      };

      setIsEditingAuthor(false);
    };
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-xl"
          style={{
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 8px 24px -4px rgba(0, 0, 0, 0.1)",
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
          }}
        >
          {/* Header with gradient */}
          <div className="w-full h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.90625 20.2491C3.82775 18.6531 5.1531 17.3278 6.74919 16.4064C8.34527 15.485 10.1568 15 12.0002 15C13.8436 15 15.6551 15.4851 17.2512 16.4065C18.8473 17.3279 20.1726 18.6533 21.0941 20.2494"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {testimonial?.customer_profile ? "Edit Author" : "Add Author"}
              </h2>

              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "#f3f4f6" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditingAuthor(false)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </div>

            <form onSubmit={handleAuthorSubmit} className="space-y-6">
              {/* Avatar preview */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-3">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur opacity-30"></div>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-4 border-white shadow-lg">
                    {authorAvatar ? (
                      <img
                        src={authorAvatar}
                        alt={authorName || "Author"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {authorName ? authorName.charAt(0).toUpperCase() : "A"}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">Profile Photo</span>
              </div>

              {/* Name input */}
              <div>
                <label
                  htmlFor="authorName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-pink-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2.90625 20.2491C3.82775 18.6531 5.1531 17.3278 6.74919 16.4064C8.34527 15.485 10.1568 15 12.0002 15C13.8436 15 15.6551 15.4851 17.2512 16.4065C18.8473 17.3279 20.1726 18.6533 21.0941 20.2494"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    id="authorName"
                    ref={nameInputRef}
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="John Smith"
                  />
                </div>
              </div>

              {/* Job title and company */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="authorTitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Job Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M21 13.2539V17.4999C21 18.8806 19.8807 19.9999 18.5 19.9999H5.5C4.11929 19.9999 3 18.8806 3 17.4999V6.49994C3 5.11923 4.11929 3.99994 5.5 3.99994H18.5C19.8807 3.99994 21 5.11923 21 6.49994V13.2539M7 8.99994H17M7 12.9999H11"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <input
                      id="authorTitle"
                      value={authorTitle}
                      onChange={(e) => setAuthorTitle(e.target.value)}
                      className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Marketing Director"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="authorCompany"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M3 9.5L12 4L21 9.5M3 9.5V18.5C3 19.0523 3.44772 19.5 4 19.5H8.5M3 9.5L4.75 8.25M21 9.5V18.5C21 19.0523 20.5523 19.5 20 19.5H15.5M21 9.5L19.25 8.25M12 13H8.5V19.5M12 13V19.5M12 13H15.5V19.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <input
                      id="authorCompany"
                      value={authorCompany}
                      onChange={(e) => setAuthorCompany(e.target.value)}
                      className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 12.75C13.6569 12.75 15 11.4069 15 9.75C15 8.09315 13.6569 6.75 12 6.75C10.3431 6.75 9 8.09315 9 9.75C9 11.4069 10.3431 12.75 12 12.75Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19.5 9.75C19.5 16.5 12 21.75 12 21.75C12 21.75 4.5 16.5 4.5 9.75C4.5 7.76088 5.29018 5.85322 6.6967 4.4467C8.10322 3.04018 10.0109 2.25 12 2.25C13.9891 2.25 15.8968 3.04018 17.3033 4.4467C18.7098 5.85322 19.5 7.76088 19.5 9.75V9.75Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="San Francisco"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="locationCountry"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Country
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 12H22M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label
                  htmlFor="authorAvatar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Profile Photo URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M2 12.3197C2 13.1708 2.11055 13.6691 2.26894 14.0432C2.38057 14.3085 2.52988 14.5513 2.7135 14.7663C2.90793 14.9943 3.18253 15.2267 3.6224 15.6118L9.4776 20.5224C10.3412 21.2559 10.7739 21.6232 11.2274 21.812C11.63 21.9796 12.0666 22.0723 12.5107 22.0866C13.014 22.103 13.5361 21.9318 14.5692 21.5952L19.8882 19.4452C20.5499 19.2098 20.8798 19.0917 21.1186 18.9217C21.528 18.6345 21.8566 18.2401 22.0786 17.7842C22.2188 17.5049 22.3 17.1714 22.3 16.7225V7.3197C22.3 6.47862 22.1894 5.98034 22.0311 5.60618C21.9194 5.34093 21.7701 5.09818 21.5865 4.88316C21.3921 4.65519 21.1175 4.42278 20.6776 4.03777L14.8224 -0.872405C13.9588 -1.60586 13.5261 -1.97321 13.0726 -2.16198C12.67 -2.32955 12.2334 -2.42227 11.7893 -2.43659C11.286 -2.45295 10.7639 -2.28179 9.73083 -1.94517L4.41176 0.204833C3.75008 0.440262 3.42024 0.558369 3.18138 0.728338C2.77205 1.0155 2.44344 1.40987 2.22145 1.8658C2.08117 2.1451 2 2.47855 2 2.9275V12.3197Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 4C15 8.97056 15 11.4559 15 16.4264"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 6C8 8.91108 8 10.4167 8 16M8 6L18 2M8 6L2 4M8 16L2 14M8 16L18 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    id="authorAvatar"
                    value={authorAvatar}
                    onChange={(e) => setAuthorAvatar(e.target.value)}
                    className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a URL for the author's profile photo
                  </p>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditingAuthor(false)}
                  className="mr-3 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 4px 12px -2px rgba(99, 102, 241, 0.3)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-medium relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))",
                    boxShadow: "0 2px 8px -2px rgba(99, 102, 241, 0.5)",
                  }}
                >
                  {testimonial?.customer_profile
                    ? "Update Author"
                    : "Add Author"}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

type AuthorCardProps = {
  setIsEditingAuthor: React.Dispatch<React.SetStateAction<boolean>>;
};
const AuthorCard: FC<AuthorCardProps> = observer(({ setIsEditingAuthor }) => {
  const { testimonial } = workspaceHub.testimonialManager;
  if (!testimonial?.customer_profile) return null;

  const { name, title, company, avatar_url } = testimonial.customer_profile;
  const location = testimonial.customer_profile?.location;

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative rounded-xl overflow-hidden bg-white p-6 shadow-sm">
        {/* Decorative top bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>

        {/* Author info */}
        <div className="flex items-start mb-6">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-25"></div>
            {avatar_url ? (
              <img
                src={avatar_url}
                alt={name}
                className="relative w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-md">
                {name?.charAt(0)}
              </div>
            )}
          </motion.div>

          <div className="ml-5 flex-1">
            <div className="flex justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{name}</h4>
                {(title || company) && (
                  <p className="text-sm text-gray-600">
                    {title}
                    {title && company && " • "}
                    {company && (
                      <span className="font-medium text-gray-700">
                        {company}
                      </span>
                    )}
                  </p>
                )}

                {location && (
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <svg
                      className="w-3.5 h-3.5 mr-1 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 12.75C13.6569 12.75 15 11.4069 15 9.75C15 8.09315 13.6569 6.75 12 6.75C10.3431 6.75 9 8.09315 9 9.75C9 11.4069 10.3431 12.75 12 12.75Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19.5 9.75C19.5 16.5 12 21.75 12 21.75C12 21.75 4.5 16.5 4.5 9.75C4.5 7.76088 5.29018 5.85322 6.6967 4.4467C8.10322 3.04018 10.0109 2.25 12 2.25C13.9891 2.25 15.8968 3.04018 17.3033 4.4467C18.7098 5.85322 19.5 7.76088 19.5 9.75V9.75Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{location}</span>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditingAuthor(true)}
                className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16.5 3.50001C16.8978 3.10219 17.4374 2.87869 18 2.87869C18.2786 2.87869 18.5544 2.93356 18.8118 3.04017C19.0692 3.14677 19.303 3.30303 19.5 3.50001C19.697 3.697 19.8532 3.93085 19.9598 4.18822C20.0665 4.44559 20.1213 4.72144 20.1213 5.00001C20.1213 5.27859 20.0665 5.55444 19.9598 5.81181C19.8532 6.06918 19.697 6.30303 19.5 6.50001L7 19L3 20L4 16L16.5 3.50001Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Author testimonial metrics */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Testimonial Impact
            </h5>
            <span className="flex items-center text-xs font-medium text-indigo-600">
              <span className="w-1.5 h-1.5 mr-1 bg-green-500 rounded-full"></span>
              Active
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            ></motion.div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
            <div className="flex items-center text-xs font-medium text-indigo-700 mb-1">
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.00043 10.3431 9.00043 12C9.00043 13.6569 10.3435 15 12.0004 15Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Views
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-800">
                {testimonial.view_count.toLocaleString() || "0"}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full text-green-700 bg-green-100">
                +12%
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
            <div className="flex items-center text-xs font-medium text-purple-700 mb-1">
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 8C17.2091 8 19 6.20914 19 4C19 1.79086 17.2091 0 15 0C12.7909 0 11 1.79086 11 4C11 6.20914 12.7909 8 15 8Z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <path
                  d="M15 22C17.2091 22 19 20.2091 19 18C19 15.7909 17.2091 14 15 14C12.7909 14 11 15.7909 11 18C11 20.2091 12.7909 22 15 22Z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <path
                  d="M5 14C7.20914 14 9 12.2091 9 10C9 7.79086 7.20914 6 5 6C2.79086 6 1 7.79086 1 10C1 12.2091 2.79086 14 5 14Z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <path
                  d="M5.00043 11.6667C6.84043 11.6667 8.33376 10.1733 8.33376 8.33333C8.33376 6.49333 6.84043 5 5.00043 5C3.16043 5 1.66709 6.49333 1.66709 8.33333C1.66709 10.1733 3.16043 11.6667 5.00043 11.6667Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.0004 8.33333C16.8404 8.33333 18.3338 6.84 18.3338 5C18.3338 3.16 16.8404 1.66667 15.0004 1.66667C13.1604 1.66667 11.6671 3.16 11.6671 5C11.6671 6.84 13.1604 8.33333 15.0004 8.33333Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.0004 18.3333C16.8404 18.3333 18.3338 16.84 18.3338 15C18.3338 13.16 16.8404 11.6667 15.0004 11.6667C13.1604 11.6667 11.6671 13.16 11.6671 15C11.6671 16.84 13.1604 18.3333 15.0004 18.3333Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.81956 9.91833L12.1796 13.415"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.1796 6.585L7.81956 10.0817"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Shares
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-800">
                {testimonial.share_count.toLocaleString() || "0"}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full text-purple-700 bg-purple-100">
                +24%
              </span>
            </div>
          </div>
        </div>

        {/* Placements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active On
            </h5>
          </div>

          <div className="flex flex-wrap -m-1">
            <motion.div
              className="m-1 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium flex items-center"
              whileHover={{ y: -2, backgroundColor: "#e0e7ff" }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2L2 9.96552L2 22L22 22L22 9.96552L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 22V15C9.5 13.8954 10.3954 13 11.5 13H12.5C13.6046 13 14.5 13.8954 14.5 15V22"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Homepage
            </motion.div>

            <motion.div
              className="m-1 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-medium flex items-center"
              whileHover={{ y: -2, backgroundColor: "#f3e8ff" }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M16 2V6M8 2V6M3 10H21M7 14H9M7 18H9M15 14H17M15 18H17M5.2 22H18.8C19.9201 22 20.4802 22 20.908 21.782C21.2843 21.5903 21.5903 21.2843 21.782 20.908C22 20.4802 22 19.9201 22 18.8V8.2C22 7.07989 22 6.51984 21.782 6.09202C21.5903 5.71569 21.2843 5.40973 20.908 5.21799C20.4802 5 19.9201 5 18.8 5H5.2C4.07989 5 3.51984 5 3.09202 5.21799C2.71569 5.40973 2.40973 5.71569 2.21799 6.09202C2 6.51984 2 7.07989 2 8.2V18.8C2 19.9201 2 20.4802 2.21799 20.908C2.40973 21.2843 2.71569 21.5903 3.09202 21.782C3.51984 22 4.07989 22 5.2 22Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Product Page
            </motion.div>

            <motion.div
              className="m-1 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium flex items-center"
              whileHover={{ y: -2, backgroundColor: "#f9fafb" }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 9.75V13.25M12 16.25V16.3M18.3 19.7436L13.5749 6.63034C13.0673 5.37557 12.8135 4.74819 12.4337 4.47045C12.1043 4.23095 11.6957 4.23095 11.3663 4.47045C10.9865 4.74819 10.7327 5.37557 10.2251 6.63034L5.7 19.7436C5.2432 20.8804 5.01479 21.4488 5.12203 21.8733C5.21388 22.2427 5.46252 22.5501 5.7993 22.7146C6.18685 22.9055 6.81115 22.7512 8.05976 22.4425L16.1402 20.5575C17.3889 20.2488 18.0132 20.0945 18.4007 19.9036C18.7375 19.7391 18.9861 19.4316 19.078 19.0622C19.1852 18.6378 18.9568 18.0693 18.5 16.9325L18.3 19.7436Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add Location
            </motion.div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: "0 4px 16px -2px rgba(99, 102, 241, 0.3)",
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))",
              boxShadow: "0 3px 10px -3px rgba(99, 102, 241, 0.6)",
            }}
            onClick={() => workspaceHub.uiManager.toggleShareDrawer(true)}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <path
                d="M7.21721 10.9071C6.83295 10.2169 7.29599 9.38857 8.0369 9.24284L9.47024 8.95554C9.77335 8.89837 10.0235 8.70008 10.1451 8.42194L10.935 6.79293C11.338 6.02586 12.4093 6.0123 12.8301 6.76957L13.6701 8.42194C13.7918 8.70008 14.0419 8.89837 14.345 8.95554L15.7783 9.24284C16.5192 9.38857 16.9823 10.2169 16.598 10.9071L15.711 12.491C15.5237 12.8045 15.4736 13.1868 15.5761 13.5419L16.0137 14.9487C16.2118 15.6772 15.5335 16.3155 14.8584 16.0117L13.5912 15.3578C13.2693 15.1975 12.897 15.1975 12.575 15.3578L11.3079 16.0117C10.6328 16.3155 9.95445 15.6772 10.1526 14.9487L10.5901 13.5419C10.6927 13.1868 10.6425 12.8045 10.4552 12.491L9.56829 10.9071"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            Share Testimonial
          </motion.button>
        </div>
      </div>
    </div>
  );
});

type AddAuthorCardProps = {
  setIsEditingAuthor: React.Dispatch<React.SetStateAction<boolean>>;
};
const AddAuthorCard: FC<AddAuthorCardProps> = ({ setIsEditingAuthor }) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative rounded-xl overflow-hidden bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center py-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mt-20 -mr-20 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full -mb-20 -ml-20 opacity-30"></div>

          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur opacity-20"></div>
            <div className="relative w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center mb-2">
              <svg
                className="w-8 h-8 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.90625 20.2491C3.82775 18.6531 5.1531 17.3278 6.74919 16.4064C8.34527 15.485 10.1568 15 12.0002 15C13.8436 15 15.6551 15.4851 17.2512 16.4065C18.8473 17.3279 20.1726 18.6533 21.0941 20.2494"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2 relative">
            Add Author Details
          </h3>
          <p className="text-gray-600 max-w-sm mb-8 relative">
            Adding an author to your testimonial increases credibility and
            boosts conversion rates significantly.
          </p>

          <motion.button
            whileHover={{
              scale: 1.03,
              boxShadow: "0 8px 20px -4px rgba(99, 102, 241, 0.5)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsEditingAuthor(true)}
            className="px-5 py-3 rounded-lg text-white font-medium relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))",
              boxShadow: "0 4px 10px -2px rgba(99, 102, 241, 0.5)",
            }}
          >
            <span className="relative z-10 flex items-center">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.90625 20.2491C3.82775 18.6531 5.1531 17.3278 6.74919 16.4064C8.34527 15.485 10.1568 15 12.0002 15C13.8436 15 15.6551 15.4851 17.2512 16.4065C18.8473 17.3279 20.1726 18.6533 21.0941 20.2494"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add Author
            </span>
          </motion.button>

          {/* Info badges */}
          <div className="grid grid-cols-3 gap-3 mt-10 relative">
            <div className="rounded-xl bg-indigo-50 p-3 flex flex-col items-center">
              <svg
                className="w-5 h-5 text-indigo-600 mb-1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 12L11 14L15 10M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">
                Credibility
              </span>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 flex flex-col items-center">
              <svg
                className="w-5 h-5 text-purple-600 mb-1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M16 18L18 20L22 16M12 15C8.68629 15 6 12.3137 6 9C6 5.68629 8.68629 3 12 3C15.3137 3 18 5.68629 18 9C18 9.88588 17.7973 10.7238 17.4321 11.4749M17 21H7C4.79086 21 3 19.2091 3 17V16.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">Trust</span>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 flex flex-col items-center">
              <svg
                className="w-5 h-5 text-blue-600 mb-1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17M9 22H15M15 16L12.9167 14.4167C11.193 15.4722 9 14.2386 9 12.1667C9 10.8215 10.0948 9.72222 11.4583 9.72222C11.7684 9.72222 12.0718 9.78421 12.3512 9.90069L15 11L14.4179 8.49614C14.3778 8.32522 14.3582 8.23976 14.349 8.15678C14.2834 7.62706 14.6222 7.13315 15.1519 7.0676C15.235 7.05845 15.3252 7.06351 15.5057 7.07361L18 7.25L15.5057 6.07361C15.3252 6.06351 15.235 6.05845 15.1519 6.0676C14.6222 6.13315 14.2834 6.62706 14.349 7.15678C14.3582 7.23976 14.3778 7.32522 14.4179 7.49614L15 10L12.3512 8.90069C12.0718 8.78421 11.7684 8.72222 11.4583 8.72222C10.0948 8.72222 9 7.62319 9 6.27778C9 4.20587 11.193 2.97222 12.9167 4.02778L15 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">
                Conversions
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = observer(() => {
  const { testimonial } = workspaceHub.testimonialManager;
  const [, setActiveStat] = useState<string | null>(null);

  const statControls = useAnimation();

  // Start stat animations
  useEffect(() => {
    if (testimonial) {
      statControls.start({
        width: "100%",
        transition: { duration: 1.2, ease: "easeOut" },
      });
    }
  }, [testimonial, statControls]);

  if (!testimonial) return null;

  return (
    <div className="my-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3 13.125C3 12.5037 3 12.1931 3.10299 11.9331C3.19446 11.7014 3.34195 11.4958 3.53391 11.3385C3.75043 11.1639 4.04946 11.0719 4.64751 10.888L15.5299 7.03886C16.2227 6.82009 16.569 6.7107 16.8521 6.77582C17.1 6.83296 17.3194 6.98218 17.475 7.19072C17.6553 7.42938 17.7023 7.7913 17.7963 8.51514L19.1521 16.1096C19.2471 16.8398 19.2945 17.2049 19.1715 17.4537C19.0618 17.6747 18.8798 17.8451 18.653 17.9424C18.3957 18.0526 18.0332 17.9721 17.3082 17.8113L6.52048 15.8028C5.92498 15.6687 5.62723 15.6016 5.40582 15.4477C5.21068 15.3137 5.0546 15.1337 4.95328 14.9232C4.83579 14.6804 4.81857 14.3815 4.78412 13.7837L4.6875 12.125M12 8V20M12 8L8 12M12 8L16 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Performance
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Views Stat */}
        <motion.div
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-100"
          whileHover={{
            y: -4,
            boxShadow: "0 12px 24px -8px rgba(70, 70, 200, 0.15)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          onHoverStart={() => setActiveStat("views")}
          onHoverEnd={() => setActiveStat(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </span>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                +12%
              </div>
            </div>
            <div className="flex items-center mb-2">
              <span className="text-2xl font-bold text-gray-800">
                {testimonial.view_count.toLocaleString()}
              </span>
              <svg
                className="w-5 h-5 ml-2 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.00043 10.3431 9.00043 12C9.00043 13.6569 10.3435 15 12.0004 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                initial={{ width: "0%" }}
                animate={statControls}
                style={{ width: "75%" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Shares Stat */}
        <motion.div
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-100"
          whileHover={{
            y: -4,
            boxShadow: "0 12px 24px -8px rgba(150, 70, 200, 0.15)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          onHoverStart={() => setActiveStat("shares")}
          onHoverEnd={() => setActiveStat(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </span>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
                +24%
              </div>
            </div>
            <div className="flex items-center mb-2">
              <span className="text-2xl font-bold text-gray-800">
                {testimonial.share_count.toLocaleString()}
              </span>
              <svg
                className="w-5 h-5 ml-2 text-purple-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M7.21721 10.9071C6.83295 10.2169 7.29599 9.38857 8.0369 9.24284L9.47024 8.95554C9.77335 8.89837 10.0235 8.70008 10.1451 8.42194L10.935 6.79293C11.338 6.02586 12.4093 6.0123 12.8301 6.76957L13.6701 8.42194C13.7918 8.70008 14.0419 8.89837 14.345 8.95554L15.7783 9.24284C16.5192 9.38857 16.9823 10.2169 16.598 10.9071L15.711 12.491C15.5237 12.8045 15.4736 13.1868 15.5761 13.5419L16.0137 14.9487C16.2118 15.6772 15.5335 16.3155 14.8584 16.0117L13.5912 15.3578C13.2693 15.1975 12.897 15.1975 12.575 15.3578L11.3079 16.0117C10.6328 16.3155 9.95445 15.6772 10.1526 14.9487L10.5901 13.5419C10.6927 13.1868 10.6425 12.8045 10.4552 12.491L9.56829 10.9071"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
                initial={{ width: "0%" }}
                animate={statControls}
                style={{ width: "60%" }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conversion Impact */}
      <motion.div
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm border border-amber-100 mb-6"
        whileHover={{
          y: -2,
          boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.15)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -m-10 blur-2xl"></div>
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -m-5 blur-xl"></div>

        <div className="relative p-4">
          <div className="flex items-center mb-3">
            <svg
              className="w-5 h-5 mr-2 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M16 8L8 16M12 12L16 16M8 8L10 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium text-amber-800">
              Conversion Impact
            </span>
          </div>

          <div className="text-sm text-gray-700 mb-3">
            This testimonial has driven an estimated{" "}
            <span className="font-bold">14% increase</span> in conversion rate
            when displayed on your landing page.
          </div>

          <div className="flex justify-end">
            <button className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center">
              View detailed report
              <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 5L15 12L9 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Placement card */}
      <div className="rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-100 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Current Placement
        </h4>

        <div className="space-y-2.5 mb-3">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm border border-blue-100">
                <svg
                  className="w-4 h-4 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2L2 9.96552L2 22L22 22L22 9.96552L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.5 22V15C9.5 13.8954 10.3954 13 11.5 13H12.5C13.6046 13 14.5 13.8954 14.5 15V22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-800">
                Homepage
              </span>
            </div>
            <div className="px-2 py-0.5 rounded text-xs font-medium text-blue-700 bg-blue-100/50">
              Active
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm border border-purple-100">
                <svg
                  className="w-4 h-4 text-purple-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 10H21M5.2 6H18.8C19.9201 6 20.4802 6 20.908 6.21799C21.2843 6.40973 21.5903 6.71569 21.782 7.09202C22 7.51984 22 8.07989 22 9.2V18.8C22 19.9201 22 20.4802 21.782 20.908C21.5903 21.2843 21.2843 21.5903 20.908 21.782C20.4802 22 19.9201 22 18.8 22H5.2C4.07989 22 3.51984 22 3.09202 21.782C2.71569 21.5903 2.40973 21.2843 2.21799 20.908C2 20.4802 2 19.9201 2 18.8V9.2C2 8.07989 2 7.51984 2.21799 7.09202C2.40973 6.71569 2.71569 6.40973 3.09202 6.21799C3.51984 6 4.07989 6 5.2 6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 2V6M16 2V6M10.5 15L12.5 13M12.5 13L14.5 15M12.5 13V18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-800">
                Product Page
              </span>
            </div>
            <div className="px-2 py-0.5 rounded text-xs font-medium text-purple-700 bg-purple-100/50">
              Active
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900">
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
              <path
                d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.00043 10.3431 9.00043 12C9.00043 13.6569 10.3435 15 12.0004 15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View all placements
          </button>
        </div>
      </div>
    </div>
  );
});
