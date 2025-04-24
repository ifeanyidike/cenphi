import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  useAnimation,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NavbarProps } from "./types";
// import { navVariants } from "./data";
import FeaturesMenu from "./FeaturesMenu";
import SolutionsMenu from "./SolutionsMenu";
import ResourcesMenu from "./ResourcesMenu";
import NotificationBell from "./NotificationBell";
import MobileMenuOverlay from "./MobileMenuOverlay";
import AuthMenu from "./AuthMenu";
import { cn } from "@/lib/utils";

const Navbar: React.FC<NavbarProps> = ({
  userLoggedIn = false,
  premiumUser = false,
  darkMode = false,
  // onToggleDarkMode = () => {},
  className = "",
  alwaysDarkText = false,
}) => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(true);

  const [isSearchOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

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

  // Features mega menu data with enhanced options

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

  return (
    <div
      ref={navRef}
      className={cn(darkMode ? "dark " : "", className)}
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
        // variants={navVariants}
        initial="visible"
        animate={navControls}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300  ${
          hasScrolled ? "dark:border-b dark:border-gray-800" : ""
        }`}
      >
        <main
          // className={`transition-all duration-300 ${
          //   isScrolled ? "shadow-lg py-2" : "py-4"
          // }`}
          // bg-white dark:bg-gray-900/90 dark:text-white text-gray-800
          className={`transition-all duration-300 max-md:!bg-white ${
            isScrolled
              ? "!bg-white/95 !backdrop-blur-md !shadow-lg !py-2 !text-gray-700"
              : alwaysDarkText
              ? "!bg-transparent !py-4 !text-gray-700"
              : "!bg-transparent !py-4 !text-white"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Logo with enhanced animation */}
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
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

                  <span
                    className={cn(
                      "text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 font-playball md:dark:from-white md:dark:to-gray-100  bg-clip-text text-transparent transform transition-transform group-hover:translate-x-0.5",
                      isScrolled && "dark:!from-indigo-600 dark:!to-purple-600"
                    )}
                  >
                    Cenphi
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation with enhanced interactions */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Features Menu */}
                <FeaturesMenu
                  isActive={activeMenu === "features"}
                  toggleMenu={toggleMenu}
                  className={
                    isScrolled || alwaysDarkText
                      ? "!text-gray-700 hover:!text-indigo-600 "
                      : "text-white hover:text-indigo-200"
                  }
                />

                {/* Solutions Menu - Enhanced with Cards */}
                <SolutionsMenu
                  isActive={activeMenu === "solutions"}
                  toggleMenu={toggleMenu}
                  className={
                    isScrolled || alwaysDarkText
                      ? "!text-gray-700 hover:!text-indigo-600"
                      : "text-white hover:text-indigo-200"
                  }
                />

                {/* Resources Menu */}
                <ResourcesMenu
                  isActive={activeMenu === "resources"}
                  toggleMenu={toggleMenu}
                  className={
                    isScrolled || alwaysDarkText
                      ? "!text-gray-700 hover:!text-indigo-600"
                      : "text-white hover:text-indigo-200"
                  }
                />

                {/* Pricing Link */}
                {/* <Link
                  to="/pricing"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                >
                  Pricing
                </Link> */}
                <Link
                  to="/pricing"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isScrolled || alwaysDarkText
                      ? "text-gray-700 hover:text-indigo-600"
                      : "text-white hover:text-indigo-200"
                  } hover:bg-gray-50/20 dark:hover:bg-gray-800/50`}
                >
                  Pricing
                </Link>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-1 md:gap-2">
                {/* Search Button */}
                {/* <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button> */}

                {/* Dark Mode Toggle */}

                {/* Notification Bell */}
                <NotificationBell
                  isNotificationOpen={isNotificationOpen}
                  setIsNotificationOpen={setIsNotificationOpen}
                  notificationRef={notificationRef}
                  setActiveMenu={setActiveMenu}
                  setIsUserMenuOpen={setIsUserMenuOpen}
                />

                {/* User Menu - Enhanced with animation */}
                <AuthMenu
                  isUserMenuOpen={isUserMenuOpen}
                  premiumUser={premiumUser}
                  setActiveMenu={setActiveMenu}
                  setIsNotificationOpen={setIsNotificationOpen}
                  setIsUserMenuOpen={setIsUserMenuOpen}
                  userLoggedIn={userLoggedIn}
                  userMenuRef={userMenuRef}
                  className={
                    isScrolled || alwaysDarkText
                      ? "!text-gray-700 hover:!text-indigo-600"
                      : "text-white hover:text-indigo-200"
                  }
                />

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
          {isMobileMenuOpen && (
            <MobileMenuOverlay
              activeMenu={activeMenu}
              isMobileMenuOpen={isMobileMenuOpen}
              toggleMenu={toggleMenu}
              closeMobileMenu={() => setIsMobileMenuOpen(false)}
            />
          )}
        </main>
      </motion.nav>
    </div>
  );
};

export default Navbar;