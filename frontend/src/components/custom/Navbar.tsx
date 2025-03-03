import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  X,
  MessageSquareText,
  BarChart3,
  Award,
  Users,
  FileText,
  Share2,
  BookOpen,
  Play,
  Calendar,
  HelpCircle,
  Settings,
  User,
  LogOut,
  Bell,
} from "lucide-react";

// Type definitions
type MegaMenuSection = {
  title: string;
  items: {
    icon: React.ReactNode;
    title: string;
    description: string;
    path: string;
    isNew?: boolean;
    isPro?: boolean;
  }[];
};

type NavbarProps = {
  userLoggedIn?: boolean;
};

const Navbar: React.FC<NavbarProps> = ({ userLoggedIn = false }) => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Sample notification data
  const notifications = [
    {
      id: 1,
      message: "New testimonial received from Acme Inc.",
      time: "2 minutes ago",
      isUnread: true,
    },
    {
      id: 2,
      message: "Weekly analytics report is ready to view",
      time: "1 hour ago",
      isUnread: true,
    },
    {
      id: 3,
      message: "3 testimonials pending approval",
      time: "3 hours ago",
      isUnread: false,
    },
    {
      id: 4,
      message: "Your AI enhancement quota has been refreshed",
      time: "Yesterday",
      isUnread: false,
    },
  ];

  // Features mega menu data
  const featuresMenuData: MegaMenuSection[] = [
    {
      title: "Testimonial Management",
      items: [
        {
          icon: <MessageSquareText className="h-6 w-6 text-indigo-500" />,
          title: "Collection",
          description: "Smart forms & automated collection tools",
          path: "/features/collection",
          isNew: true,
        },
        {
          icon: <FileText className="h-6 w-6 text-indigo-500" />,
          title: "Curation",
          description: "Organize & manage your testimonial library",
          path: "/features/curation",
        },
        {
          icon: <Award className="h-6 w-6 text-indigo-500" />,
          title: "AI Enhancement",
          description: "Intelligently improve testimonial quality",
          path: "/features/enhancement",
          isPro: true,
        },
      ],
    },
    {
      title: "Analytics & Insights",
      items: [
        {
          icon: <BarChart3 className="h-6 w-6 text-emerald-500" />,
          title: "Performance Metrics",
          description: "Track impact & conversion analytics",
          path: "/features/metrics",
        },
        {
          icon: <Users className="h-6 w-6 text-emerald-500" />,
          title: "Sentiment Analysis",
          description: "AI-powered customer sentiment tracking",
          path: "/features/sentiment",
          isPro: true,
        },
        {
          icon: <Share2 className="h-6 w-6 text-emerald-500" />,
          title: "Distribution",
          description: "Multi-channel publishing tools",
          path: "/features/distribution",
        },
      ],
    },
  ];

  // Resources mega menu data
  const resourcesMenuData: MegaMenuSection[] = [
    {
      title: "Learn & Grow",
      items: [
        {
          icon: <BookOpen className="h-6 w-6 text-amber-500" />,
          title: "Knowledge Base",
          description: "Guides & best practices for testimonials",
          path: "/resources/knowledge-base",
        },
        {
          icon: <Play className="h-6 w-6 text-amber-500" />,
          title: "Video Tutorials",
          description: "Step-by-step visual guides",
          path: "/resources/tutorials",
          isNew: true,
        },
        {
          icon: <Calendar className="h-6 w-6 text-amber-500" />,
          title: "Webinars",
          description: "Live & recorded expert sessions",
          path: "/resources/webinars",
        },
      ],
    },
    {
      title: "Support & Community",
      items: [
        {
          icon: <HelpCircle className="h-6 w-6 text-purple-500" />,
          title: "Help Center",
          description: "Find answers to common questions",
          path: "/resources/help",
        },
        {
          icon: <Users className="h-6 w-6 text-purple-500" />,
          title: "Community Forum",
          description: "Connect with other Cenphi users",
          path: "/resources/community",
        },
        {
          icon: <MessageSquareText className="h-6 w-6 text-purple-500" />,
          title: "Request a Feature",
          description: "Suggest improvements & new features",
          path: "/resources/feature-request",
        },
      ],
    },
  ];

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside of menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle menu toggle
  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <div ref={navRef}>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg py-2"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/home" className="flex items-center space-x-2">
                <svg
                  className="h-10 w-10"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5Z"
                    fill="#4F46E5"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M15 15C15 13.3431 16.3431 12 18 12H22C23.6569 12 25 13.3431 25 15V25C25 26.6569 23.6569 28 22 28H18C16.3431 28 15 26.6569 15 25V15Z"
                    fill="#4F46E5"
                  />
                  <path
                    d="M20 17.5C18.6193 17.5 17.5 18.6193 17.5 20C17.5 21.3807 18.6193 22.5 20 22.5C21.3807 22.5 22.5 21.3807 22.5 20C22.5 18.6193 21.3807 17.5 20 17.5Z"
                    fill="white"
                  />
                </svg>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Cenphi
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Features Menu */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("features")}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeMenu === "features"
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  Features
                  <ChevronDown
                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                      activeMenu === "features" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {activeMenu === "features" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-screen max-w-6xl bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-0">
                        {featuresMenuData.map((section, idx) => (
                          <div
                            key={idx}
                            className={`p-6 ${
                              idx === 0 ? "border-r border-gray-100" : ""
                            }`}
                          >
                            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                              {section.title}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              {section.items.map((item, itemIdx) => (
                                <Link
                                  key={itemIdx}
                                  to={item.path}
                                  className="group flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <h4 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">
                                        {item.title}
                                      </h4>
                                      {item.isNew && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                          New
                                        </span>
                                      )}
                                      {item.isPro && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                          Pro
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Not sure where to start?
                          </p>
                          <p className="text-sm text-gray-500">
                            Check out our quick start guide
                          </p>
                        </div>
                        <Link
                          to="/demo"
                          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Watch demo
                          <Play className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Solutions Menu */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("solutions")}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeMenu === "solutions"
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  Solutions
                  <ChevronDown
                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                      activeMenu === "solutions" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {activeMenu === "solutions" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100"
                    >
                      <div className="p-4">
                        <Link
                          to="/solutions/ecommerce"
                          className="block p-3 rounded-lg hover:bg-gray-50"
                        >
                          <h4 className="text-base font-medium text-gray-900">
                            E-Commerce
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Boost sales with authentic customer reviews
                          </p>
                        </Link>
                        <Link
                          to="/solutions/saas"
                          className="block p-3 rounded-lg hover:bg-gray-50"
                        >
                          <h4 className="text-base font-medium text-gray-900">
                            SaaS
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Build trust and reduce churn with user testimonials
                          </p>
                        </Link>
                        <Link
                          to="/solutions/agencies"
                          className="block p-3 rounded-lg hover:bg-gray-50"
                        >
                          <h4 className="text-base font-medium text-gray-900">
                            Agencies
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Showcase client success stories effectively
                          </p>
                        </Link>
                        <Link
                          to="/solutions/enterprise"
                          className="block p-3 rounded-lg hover:bg-gray-50"
                        >
                          <h4 className="text-base font-medium text-gray-900">
                            Enterprise
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Scale testimonial management across teams
                          </p>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing */}
              <Link
                to="/pricing"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
              >
                Pricing
              </Link>

              {/* Customers */}
              <Link
                to="/customers"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
              >
                Customers
              </Link>

              {/* Resources Menu */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("resources")}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeMenu === "resources"
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  Resources
                  <ChevronDown
                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                      activeMenu === "resources" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {activeMenu === "resources" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-screen max-w-4xl bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-0">
                        {resourcesMenuData.map((section, idx) => (
                          <div
                            key={idx}
                            className={`p-6 ${
                              idx === 0 ? "border-r border-gray-100" : ""
                            }`}
                          >
                            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                              {section.title}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              {section.items.map((item, itemIdx) => (
                                <Link
                                  key={itemIdx}
                                  to={item.path}
                                  className="group flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <h4 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">
                                        {item.title}
                                      </h4>
                                      {item.isNew && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                          New
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Side - Login/Signup or User Menu */}
            {userLoggedIn ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setIsNotificationOpen(!isNotificationOpen);
                      setIsUserMenuOpen(false);
                    }}
                    className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100 relative"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                              Notifications
                            </h3>
                            <button className="text-xs text-indigo-600 hover:text-indigo-800">
                              Mark all as read
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 border-b border-gray-100 ${
                                notification.isUnread ? "bg-indigo-50/30" : ""
                              }`}
                            >
                              <p className="text-sm text-gray-800">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 bg-gray-50">
                          <Link
                            to="/notifications"
                            className="block text-center text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsNotificationOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                      <span className="text-sm font-medium">JD</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            John Doe
                          </p>
                          <p className="text-sm text-gray-500">
                            john@example.com
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                          >
                            <User className="h-4 w-4" />
                            My Dashboard
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                          <hr className="my-2" />
                          <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-red-600">
                            <LogOut className="h-4 w-4" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  to="/signin"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow transition-all duration-200"
                >
                  Get started for free
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-16 inset-x-0 bg-white z-40 overflow-hidden shadow-lg"
          >
            <div className="px-4 py-6 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Mobile Menu Accordions */}
              <div className="border-b border-gray-100 pb-4">
                <div className="space-y-2">
                  {/* Features Mobile Accordion */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMenu("features-mobile")}
                      className="flex items-center justify-between w-full px-4 py-3 text-left"
                    >
                      <span className="text-base font-medium text-gray-800">
                        Features
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          activeMenu === "features-mobile" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {activeMenu === "features-mobile" && (
                      <div className="px-4 pb-4 space-y-4">
                        {featuresMenuData.map((section, idx) => (
                          <div key={idx} className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">
                              {section.title}
                            </h3>
                            {section.items.map((item, itemIdx) => (
                              <Link
                                key={itemIdx}
                                to={item.path}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  {item.icon}
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {item.title}
                                    </h4>
                                    {item.isNew && (
                                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        New
                                      </span>
                                    )}
                                    {item.isPro && (
                                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                        Pro
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Solutions Mobile Accordion */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMenu("solutions-mobile")}
                      className="flex items-center justify-between w-full px-4 py-3 text-left"
                    >
                      <span className="text-base font-medium text-gray-800">
                        Solutions
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          activeMenu === "solutions-mobile" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {activeMenu === "solutions-mobile" && (
                      <div className="px-4 pb-4 space-y-2">
                        <Link
                          to="/solutions/ecommerce"
                          className="block py-2 text-sm text-gray-700 hover:text-indigo-600"
                        >
                          E-Commerce
                        </Link>
                        <Link
                          to="/solutions/saas"
                          className="block py-2 text-sm text-gray-700 hover:text-indigo-600"
                        >
                          SaaS
                        </Link>
                        <Link
                          to="/solutions/agencies"
                          className="block py-2 text-sm text-gray-700 hover:text-indigo-600"
                        >
                          Agencies
                        </Link>
                        <Link
                          to="/solutions/enterprise"
                          className="block py-2 text-sm text-gray-700 hover:text-indigo-600"
                        >
                          Enterprise
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Pricing Mobile */}
                  <Link
                    to="/pricing"
                    className="block px-4 py-3 text-base font-medium text-gray-800 border border-gray-200 rounded-lg"
                  >
                    Pricing
                  </Link>

                  {/* Customers Mobile */}
                  <Link
                    to="/customers"
                    className="block px-4 py-3 text-base font-medium text-gray-800 border border-gray-200 rounded-lg"
                  >
                    Customers
                  </Link>

                  {/* Resources Mobile Accordion */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMenu("resources-mobile")}
                      className="flex items-center justify-between w-full px-4 py-3 text-left"
                    >
                      <span className="text-base font-medium text-gray-800">
                        Resources
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          activeMenu === "resources-mobile" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {activeMenu === "resources-mobile" && (
                      <div className="px-4 pb-4 space-y-4">
                        {resourcesMenuData.map((section, idx) => (
                          <div key={idx} className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">
                              {section.title}
                            </h3>
                            {section.items.map((item, itemIdx) => (
                              <Link
                                key={itemIdx}
                                to={item.path}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  {item.icon}
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {item.title}
                                    </h4>
                                    {item.isNew && (
                                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Login/Signup Buttons (Mobile) */}
              {!userLoggedIn ? (
                <div className="space-y-3 pt-2">
                  <Link
                    to="/signin"
                    className="block w-full text-center px-4 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-base font-medium text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Get started for free
                  </Link>
                </div>
              ) : (
                <div className="border-t border-gray-100 mt-4 pt-4">
                  <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                      <span className="text-sm font-medium">JD</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        John Doe
                      </p>
                      <p className="text-xs text-gray-500">john@example.com</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="h-4 w-4" />
                      My Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Premium Announcement Banner (can be toggled) */}
      {isScrolled && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="fixed top-16 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 z-40 py-2 text-center text-white text-sm"
        >
          <div className="flex items-center justify-center">
            <span className="mr-2">✨</span>
            <span className="font-medium">
              New AI insights feature is now available!
            </span>
            <Link to="/new-features" className="ml-2 underline font-medium">
              Learn more
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Navbar;
