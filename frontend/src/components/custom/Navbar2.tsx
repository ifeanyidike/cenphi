import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  PropsWithChildren,
} from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  MotionValue,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
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
  Search,
  Sparkles,
  Zap,
  Star,
  Globe,
  ArrowRight,
  ArrowUpRight,
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
    isHot?: boolean;
    isBeta?: boolean;
  }[];
};

type NavbarProps = {
  userLoggedIn?: boolean;
  premiumUser?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
};

// Motion variants
const navVariants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  hidden: {
    opacity: 0,
    y: -5,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

const megaMenuVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    clipPath: "inset(0% 0% 100% 0%)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
      clipPath: { duration: 0.4 },
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: {
      duration: 0.4,
      ease: [0, 0, 0.2, 1],
      clipPath: { duration: 0.5 },
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const NavbarProTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
    <Sparkles className="h-3 w-3 mr-0.5" />
    PRO
  </span>
);

const NavbarBetaTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white">
    <Zap className="h-3 w-3 mr-0.5" />
    BETA
  </span>
);

const NavbarNewTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-green-500 text-white">
    NEW
  </span>
);

const NavbarHotTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-rose-500 to-red-600 text-white">
    <Star className="h-3 w-3 mr-0.5" />
    HOT
  </span>
);

type Props = {
  children: React.ReactNode;
  className?: string;
};

const GlassPanel = ({ children, className = "" }: Props) => (
  <div className={`backdrop-blur-xl bg-white dark:bg-gray-900/90 ${className}`}>
    {children}
  </div>
);

const Navbar: React.FC<NavbarProps> = ({
  userLoggedIn = false,
  premiumUser = false,
  darkMode = false,
  onToggleDarkMode = () => {},
}) => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const navControls = useAnimation();
  const progressBarControls = useAnimation();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Sample notification data with enhanced structure
  const notifications = [
    {
      id: 1,
      message: "New testimonial received from Acme Inc.",
      time: "2 minutes ago",
      isUnread: true,
      avatar: null,
      type: "testimonial",
    },
    {
      id: 2,
      message: "Weekly analytics report is ready to view",
      time: "1 hour ago",
      isUnread: true,
      avatar: null,
      type: "report",
    },
    {
      id: 3,
      message: "3 testimonials pending approval",
      time: "3 hours ago",
      isUnread: false,
      avatar: null,
      type: "approval",
    },
    {
      id: 4,
      message: "Your AI enhancement quota has been refreshed",
      time: "Yesterday",
      isUnread: false,
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      type: "quota",
    },
    {
      id: 5,
      message: "Thomas added you to the project 'Enterprise Campaign'",
      time: "2 days ago",
      isUnread: false,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      type: "project",
    },
  ];

  // Features mega menu data with enhanced options
  const featuresMenuData: MegaMenuSection[] = [
    {
      title: "Testimonial Management",
      items: [
        {
          icon: (
            <MessageSquareText className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
          ),
          title: "Smart Collection",
          description: "AI-driven forms & automated collection tools",
          path: "/features/collection",
          isNew: true,
        },
        {
          icon: (
            <FileText className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
          ),
          title: "Curation Suite",
          description: "Organize & manage your testimonial library",
          path: "/features/curation",
        },
        {
          icon: (
            <Award className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
          ),
          title: "AI Enhancement Pro",
          description: "Intelligently improve testimonial quality & impact",
          path: "/features/enhancement",
          isPro: true,
          isHot: true,
        },
      ],
    },
    {
      title: "Analytics & Insights",
      items: [
        {
          icon: (
            <BarChart3 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
          ),
          title: "Performance Metrics",
          description: "Track impact & conversion analytics",
          path: "/features/metrics",
        },
        {
          icon: (
            <Users className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
          ),
          title: "Sentiment Analysis",
          description: "AI-powered customer sentiment tracking",
          path: "/features/sentiment",
          isPro: true,
        },
        {
          icon: (
            <Share2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
          ),
          title: "Omnichannel Distribution",
          description: "Multi-channel publishing & automation tools",
          path: "/features/distribution",
          isBeta: true,
        },
      ],
    },
  ];

  // Resources mega menu data with enhanced options
  const resourcesMenuData: MegaMenuSection[] = [
    {
      title: "Learn & Grow",
      items: [
        {
          icon: (
            <BookOpen className="h-6 w-6 text-amber-500 dark:text-amber-400" />
          ),
          title: "Knowledge Base",
          description: "Guides & best practices for testimonials",
          path: "/resources/knowledge-base",
        },
        {
          icon: <Play className="h-6 w-6 text-amber-500 dark:text-amber-400" />,
          title: "Expert Tutorials",
          description: "Step-by-step visual masterclasses",
          path: "/resources/tutorials",
          isNew: true,
        },
        {
          icon: (
            <Calendar className="h-6 w-6 text-amber-500 dark:text-amber-400" />
          ),
          title: "Live Webinars",
          description: "Interactive expert sessions & workshops",
          path: "/resources/webinars",
          isPro: true,
        },
      ],
    },
    {
      title: "Support & Community",
      items: [
        {
          icon: (
            <HelpCircle className="h-6 w-6 text-purple-500 dark:text-purple-400" />
          ),
          title: "Help Center",
          description: "Find answers to common questions",
          path: "/resources/help",
        },
        {
          icon: (
            <Users className="h-6 w-6 text-purple-500 dark:text-purple-400" />
          ),
          title: "Community Forum",
          description: "Connect with other Cenphi users",
          path: "/resources/community",
        },
        {
          icon: (
            <MessageSquareText className="h-6 w-6 text-purple-500 dark:text-purple-400" />
          ),
          title: "Feature Lab",
          description: "Vote on & suggest new innovations",
          path: "/resources/feature-request",
          isBeta: true,
        },
      ],
    },
  ];

  // Solution cards with enhanced content
  const solutionCards = [
    {
      title: "E-Commerce",
      description: "Boost conversions by 47% with authentic customer reviews",
      icon: <Globe className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
      path: "/solutions/ecommerce",
      stats: "2.5x higher engagement",
      color: "blue",
    },
    {
      title: "SaaS",
      description: "Build trust & reduce churn with strategic user stories",
      icon: <Zap className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />,
      path: "/solutions/saas",
      stats: "37% lower churn rate",
      color: "emerald",
    },
    {
      title: "Agencies",
      description: "Showcase client success stories that win new business",
      icon: <Award className="h-6 w-6 text-amber-500 dark:text-amber-400" />,
      path: "/solutions/agencies",
      stats: "52% higher close rate",
      color: "amber",
    },
    {
      title: "Enterprise",
      description: "Scale testimonial management across global teams",
      icon: (
        <BarChart3 className="h-6 w-6 text-purple-500 dark:text-purple-400" />
      ),
      path: "/solutions/enterprise",
      stats: "3.2x ROI improvement",
      color: "purple",
      isNew: true,
    },
  ];

  // Handle scroll events with enhanced tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      setIsScrolled(scrollPosition > 10);

      // Calculate scroll progress percentage
      const scrollPercentage = Math.min(
        (scrollPosition / (docHeight - windowHeight)) * 100,
        100
      );
      setScrollProgress(scrollPercentage);

      if (scrollPosition > 100 && !hasScrolled) {
        setHasScrolled(true);
      } else if (scrollPosition <= 10 && hasScrolled) {
        setHasScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasScrolled]);

  // Auto-hide navbar on scroll down, show on scroll up
  useEffect(() => {
    let prevScrollY = window.scrollY;

    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        navControls.start("visible");
        return;
      }

      if (currentScrollY > prevScrollY) {
        // Scrolling down
        navControls.start("hidden");
      } else {
        // Scrolling up
        navControls.start("visible");
      }

      prevScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScrollDirection);
    return () => window.removeEventListener("scroll", handleScrollDirection);
  }, [navControls]);

  // Update progress bar animation
  useEffect(() => {
    progressBarControls.set({ width: `${scrollProgress}%` });
  }, [scrollProgress, progressBarControls]);

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

  // Focus search input when search modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Reset mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveMenu(null);
  }, [location]);

  // Mouse position effect for glossy interactions
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  // Handle menu toggle with improved touch
  const toggleMenu = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
      setIsUserMenuOpen(false);
      setIsNotificationOpen(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
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

  // Unread notification count
  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div
      ref={navRef}
      className={darkMode ? "dark" : ""}
      onMouseMove={handleMouseMove}
    >
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[60]"
        animate={progressBarControls}
        style={{
          scaleX: useSpring(useTransform(mouseX, [0, 800], [0.8, 1.2])),
        }}
      />

      <motion.nav
        variants={navVariants}
        initial="visible"
        animate={navControls}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hasScrolled ? "dark:border-b dark:border-gray-800" : ""
        }`}
      >
        <GlassPanel
          className={`transition-all duration-300 ${
            isScrolled ? "shadow-lg py-2" : "py-4"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Logo with enhanced animation */}
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/home"
                  className="flex items-center space-x-2 group"
                  onMouseEnter={() => {
                    // Add logo hover animation logic
                  }}
                >
                  <div className="relative">
                    <svg
                      className="h-10 w-10 transition-transform duration-500 ease-out group-hover:rotate-[360deg]"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5Z"
                        className="fill-indigo-500/20 dark:fill-indigo-400/20"
                      />
                      <path
                        d="M15 15C15 13.3431 16.3431 12 18 12H22C23.6569 12 25 13.3431 25 15V25C25 26.6569 23.6569 28 22 28H18C16.3431 28 15 26.6569 15 25V15Z"
                        className="fill-indigo-600 dark:fill-indigo-400"
                      />
                      <motion.path
                        d="M20 17.5C18.6193 17.5 17.5 18.6193 17.5 20C17.5 21.3807 18.6193 22.5 20 22.5C21.3807 22.5 22.5 21.3807 22.5 20C22.5 18.6193 21.3807 17.5 20 17.5Z"
                        className="fill-white dark:fill-gray-900"
                        animate={{
                          scale: [1, 1.1, 1],
                          transition: {
                            repeat: Infinity,
                            repeatType: "reverse",
                            duration: 2,
                            ease: "easeInOut",
                          },
                        }}
                      />
                    </svg>

                    {/* Animated glow effect on hover */}
                    <motion.div
                      className="absolute inset-0 -z-10 rounded-full opacity-0 group-hover:opacity-100 blur-xl"
                      animate={{
                        background: [
                          "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0) 70%)",
                          "radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(168,85,247,0) 70%)",
                          "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0) 70%)",
                        ],
                        transition: {
                          repeat: Infinity,
                          duration: 4,
                        },
                      }}
                    />
                  </div>

                  <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent transform transition-transform group-hover:translate-x-0.5">
                    Cenphi
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation with enhanced interactions */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Features Menu */}
                <div className="relative">
                  <button
                    onClick={() => toggleMenu("features")}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeMenu === "features"
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                        : "text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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

                {/* Solutions Menu - Enhanced with Cards */}
                <div className="relative">
                  <button
                    onClick={() => toggleMenu("solutions")}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeMenu === "solutions"
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                        : "text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                                  <Link
                                    to={solution.path}
                                    className="block p-5"
                                  >
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
                                    <div className="absolute inset-0 border-2 border-transparent opacity-0 group-hover:opacity-100 rounded-xl overflow-hidden pointer-events-none">
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

                {/* Resources Menu */}
                <div className="relative">
                  <button
                    onClick={() => toggleMenu("resources")}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeMenu === "resources"
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                        : "text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                        variants={megaMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute left-0 mt-2 w-screen max-w-6xl rounded-xl overflow-hidden z-50"
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
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 px-6 py-5 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  Free resource: The Ultimate Guide to Social
                                  Proof
                                </p>
                                <p className="text-sm text-indigo-100">
                                  Download our 28-page playbook on maximizing
                                  testimonial impact
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
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 200 200"
                              >
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

                {/* Pricing Link */}
                <Link
                  to="/pricing"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                >
                  Pricing
                </Link>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-1 md:gap-2">
                {/* Search Button */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={onToggleDarkMode}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? "text-amber-400 hover:text-amber-500 hover:bg-gray-800/50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-label={
                    darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
                >
                  {darkMode ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>

                {/* Notification Bell */}
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
                                  When you have notifications, they'll appear
                                  here
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

                {/* User Menu - Enhanced with animation */}
                {userLoggedIn ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(!isUserMenuOpen);
                        setIsNotificationOpen(false);
                        setActiveMenu(null);
                      }}
                      className="flex items-center"
                    >
                      <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <img
                          src="https://randomuser.me/api/portraits/women/24.jpg"
                          alt="User avatar"
                          className="h-full w-full object-cover"
                        />
                        {premiumUser && (
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
                                  <img
                                    src="https://randomuser.me/api/portraits/women/24.jpg"
                                    alt="User profile"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    Sarah Johnson
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    sarah.j@acmecorp.com
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
                              {premiumUser && (
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
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/login"
                      className="hidden md:inline-block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow transition-all duration-200"
                    >
                      Get started
                    </Link>
                  </div>
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
                  aria-label="Open menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="px-4 pt-2 pb-6 space-y-1 sm:px-6 lg:px-8 divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Mobile menu accordion items */}
                  <div className="py-2">
                    <button
                      onClick={() => toggleMenu("features-mobile")}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span>Features</span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          activeMenu === "features-mobile" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {activeMenu === "features-mobile" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1"
                        >
                          {featuresMenuData.map((section) => (
                            <div key={section.title} className="mb-4">
                              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {section.title}
                              </h3>
                              <div className="mt-1 space-y-1">
                                {section.items.map((item, idx) => (
                                  <Link
                                    key={idx}
                                    to={item.path}
                                    className="flex items-center py-2 px-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                  >
                                    <div className="mr-3">{item.icon}</div>
                                    <span>{item.title}</span>
                                    <div className="ml-auto flex gap-1">
                                      {item.isNew && <NavbarNewTag />}
                                      {item.isPro && <NavbarProTag />}
                                      {item.isBeta && <NavbarBetaTag />}
                                      {item.isHot && <NavbarHotTag />}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => toggleMenu("solutions-mobile")}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span>Solutions</span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          activeMenu === "solutions-mobile" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {activeMenu === "solutions-mobile" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-2 px-3"
                        >
                          {solutionCards.map((solution, idx) => (
                            <Link
                              key={idx}
                              to={solution.path}
                              className="block rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center">
                                <div
                                  className={`p-2 rounded-lg bg-${solution.color}-100 dark:bg-${solution.color}-900/20 mr-3`}
                                >
                                  {solution.icon}
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {solution.title}
                                    </h4>
                                    {solution.isNew && (
                                      <span className="ml-2">
                                        <NavbarNewTag />
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {solution.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </motion.nav>
    </div>
  );
};

export default Navbar;
