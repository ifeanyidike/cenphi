// WidgetComponents.tsx

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Testimonial } from "@/types/testimonial";

export type WidgetTheme =
  | "default"
  | "minimal"
  | "modern"
  | "elegant"
  | "vibrant"
  | "premium"
  | "dark"
  | "light"
  | "social";

export type WidgetAnimationType =
  | "fade"
  | "slide"
  | "zoom"
  | "flip"
  | "bounce"
  | "none";

export type WidgetRoundedType =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "full";

export type WidgetShadowType = "none" | "sm" | "md" | "lg" | "xl" | "2xl";

export type WidgetWidthType = "auto" | "sm" | "md" | "lg" | "xl" | "full";

export type WidgetPositionType =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type WidgetFontStyleType =
  | "modern"
  | "serif"
  | "mono"
  | "playful"
  | "elegant"
  | "bold";

export interface WidgetCustomization {
  theme: WidgetTheme;
  darkMode: boolean;
  rounded: WidgetRoundedType;
  showAvatar: boolean;
  showRating: boolean;
  showCompany: boolean;
  animation: WidgetAnimationType;
  position: WidgetPositionType;
  autoRotate?: boolean;
  highlightColor: string;
  fontStyle: WidgetFontStyleType;
  width: WidgetWidthType;
  border: boolean;
  shadow: WidgetShadowType;
  layout?: "compact" | "standard" | "expanded";
  textAlign?: "left" | "center" | "right";
}

export interface WidgetProps {
  testimonial: Testimonial;
  customizations: WidgetCustomization;
}

// Helper Functions
export const getTestimonialContent = (
  testimonial: Testimonial | undefined
): string => {
  if (!testimonial) return "";

  switch (testimonial.format) {
    case "text":
      return testimonial.content!;
    case "video":
    case "audio":
      return testimonial.transcript || "";
    case "image":
      return testimonial.content || "";
    default:
      return "";
  }
};

export const getRoundedClass = (size: WidgetRoundedType): string => {
  const roundedMap: Record<WidgetRoundedType, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };

  return roundedMap[size] || "rounded-lg";
};

export const getShadowClass = (size: WidgetShadowType): string => {
  const shadowMap: Record<WidgetShadowType, string> = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };

  return shadowMap[size] || "shadow-md";
};

export const getFontClass = (fontStyle: WidgetFontStyleType): string => {
  const fontMap: Record<WidgetFontStyleType, string> = {
    modern: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
    elegant: "font-serif italic",
    playful: "font-sans",
    bold: "font-sans font-bold",
  };

  return fontMap[fontStyle] || "font-sans";
};

/**
 * StarRating - Display star ratings with customization options
 */
export const StarRating: React.FC<{
  rating: number;
  size?: string;
  color?: string;
  darkMode?: boolean;
}> = ({ rating, size = "w-4 h-4", color = "#f59e0b", darkMode = false }) => {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${size} ${i < rating ? "" : darkMode ? "text-slate-600" : "text-slate-300"}`}
          style={{ color: i < rating ? color : "" }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

/**
 * SpotlightWidget - A premium featured testimonial display with dynamic accent colors and animations
 */
export const SpotlightWidget: React.FC<WidgetProps> = ({
  testimonial,
  customizations,
}) => {
  // Extract necessary data from testimonial
  const testimonialText = getTestimonialContent(testimonial);
  const author = testimonial.customer_profile;

  // Handle customizations with defaults
  const {
    theme = "premium",
    darkMode = false,
    rounded = "xl",
    showAvatar = true,
    showRating = true,
    showCompany = true,
    animation = "fade",
    highlightColor = "#6366f1",
    textAlign = "left",
    fontStyle = "modern",
    shadow = "xl",
    border = true,
  } = customizations;

  // Dynamic classes based on customizations
  const baseClasses = `w-full overflow-hidden transition-all duration-500 ${getRoundedClass(rounded)} ${getShadowClass(shadow)} relative`;
  const borderClass = border
    ? darkMode
      ? "border border-slate-700/50"
      : "border border-slate-200/70"
    : "";
  const bgClass = darkMode ? "bg-slate-900" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-slate-900";
  const subtextClass = darkMode ? "text-slate-300" : "text-slate-600";

  // Typography based on font style
  const fontClass = getFontClass(fontStyle);

  // Animation variants based on customizations.animation
  const contentVariants = {
    initial: {
      opacity: 0,
      y: animation === "fade" ? 0 : 20,
      scale: animation === "zoom" ? 0.95 : 1,
      rotateX: animation === "flip" ? 90 : 0,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      y: animation === "slide" ? 20 : 0,
      scale: animation === "zoom" ? 0.95 : 1,
      transition: { duration: 0.5 },
    },
  };

  // Default placeholder avatar URL
  const defaultAvatar = "https://randomuser.me/api/portraits/women/42.jpg";

  return (
    <div
      className={`${baseClasses} ${bgClass} ${borderClass} ${textAlign === "center" ? "text-center" : ""}`}
    >
      {/* Decorative elements */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{
          background: `radial-gradient(circle, ${highlightColor} 0%, transparent 70%)`,
        }}
      />

      {theme === "premium" && (
        <div
          className="absolute top-0 right-0 w-full h-1"
          style={{
            background: `linear-gradient(to right, transparent, ${highlightColor}, transparent)`,
          }}
        />
      )}

      <div className="relative p-8 lg:p-10">
        {/* Quote icon */}
        <div
          className="w-12 h-12 mb-6 flex items-center justify-center rounded-full"
          style={{ backgroundColor: `${highlightColor}20` }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: highlightColor }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={contentVariants}
          className="space-y-6"
        >
          {showRating && testimonial.rating && (
            <div className="mb-4">
              <StarRating
                rating={testimonial.rating}
                size="w-5 h-5"
                color={highlightColor}
                darkMode={darkMode}
              />
            </div>
          )}

          <blockquote className="mb-6">
            <p
              className={`text-xl font-medium leading-relaxed ${textClass} ${fontClass}`}
            >
              "{testimonialText}"
            </p>
          </blockquote>

          <div
            className={`flex items-center ${textAlign === "center" ? "justify-center" : ""}`}
          >
            {showAvatar && (
              <div className="relative mr-4">
                <div
                  className="absolute inset-0 rounded-full opacity-50 blur-sm"
                  style={{ backgroundColor: highlightColor }}
                ></div>
                <img
                  src={author?.avatar_url || defaultAvatar}
                  alt={author?.name}
                  className="relative w-14 h-14 rounded-full object-cover border-2 border-white"
                />
              </div>
            )}

            <div>
              <p className={`text-lg font-medium ${textClass}`}>
                {author?.name}
              </p>
              {showCompany && author?.title && author.company && (
                <p className={`text-sm ${subtextClass}`}>
                  {author.title}, {author.company}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * CarouselWidget - An elegant carousel for displaying multiple testimonials
 */
export const CarouselWidget: React.FC<WidgetProps> = ({
  testimonial,
  customizations,
}) => {
  // For demo purposes, create multiple testimonials from the single testimonial
  const testimonials: Array<Testimonial> = [testimonial];

  // Add more testimonials duplicated from the original for demo purposes
  if (testimonial) {
    const secondTestimonial: Testimonial = {
      ...testimonial,
      id: testimonial.id + "-2",
      customer_profile: {
        ...(testimonial.customer_profile! || {}),
        name: `${testimonial.customer_profile?.name?.split(" ")[0]} Johnson`,
        created_at: new Date(),
      },
    };

    const thirdTestimonial: Testimonial = {
      ...testimonial,
      id: testimonial.id + "-3",
      customer_profile: {
        ...(testimonial.customer_profile! || {}),
        name: `${testimonial.customer_profile?.name?.split(" ")[0]} Thompson`,
      },
    };

    testimonials.push(secondTestimonial, thirdTestimonial);
  }

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(
    customizations?.autoRotate || false
  );

  // Handle customizations with defaults
  const {
    // theme = "modern",
    darkMode = false,
    rounded = "lg",
    showAvatar = true,
    showRating = true,
    showCompany = true,
    // animation = "slide",
    highlightColor = "#3b82f6",
    shadow = "md",
    border = true,
    width = "full",
    textAlign = "left",
  } = customizations;

  // Auto-rotate functionality
  useEffect(() => {
    let intervalId: number | undefined;

    if (isAutoPlaying && testimonials.length > 1) {
      intervalId = setInterval(() => {
        setDirection(1);
        setActiveIndex((prevIndex) =>
          prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPlaying, testimonials.length]);

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  const handlePrevious = () => {
    setDirection(-1);
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Generate dynamic classes based on customizations
  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${getRoundedClass(rounded)} ${getShadowClass(shadow)}`;
  const borderClass = border
    ? darkMode
      ? "border border-slate-700"
      : "border border-slate-200"
    : "";
  const bgClass = darkMode ? "bg-slate-800" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-slate-900";
  const subtextClass = darkMode ? "text-slate-300" : "text-slate-600";

  // Handle width classes
  const widthClass =
    width === "full"
      ? "w-full"
      : width === "md"
        ? "max-w-md mx-auto"
        : width === "lg"
          ? "max-w-lg mx-auto"
          : "max-w-xl mx-auto";

  // Default placeholder avatar URL
  const defaultAvatar = "https://randomuser.me/api/portraits/men/32.jpg";

  return (
    <div className={`${baseClasses} ${bgClass} ${borderClass} ${widthClass}`}>
      <div className="p-1">
        {/* Carousel track */}
        <div className="relative overflow-hidden pb-12">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6"
            >
              {showRating && testimonials[activeIndex]?.rating && (
                <div className="mb-3">
                  <StarRating
                    rating={testimonials[activeIndex].rating!}
                    color={highlightColor}
                    darkMode={darkMode}
                  />
                </div>
              )}

              <blockquote className="mb-4">
                <p className={`text-base ${textClass}`}>
                  {getTestimonialContent(testimonials[activeIndex])}
                </p>
              </blockquote>

              <div
                className={`flex items-center ${textAlign === "center" ? "justify-center" : ""}`}
              >
                {showAvatar && (
                  <img
                    src={
                      testimonials[activeIndex].customer_profile?.avatar_url ||
                      defaultAvatar
                    }
                    alt={testimonials[activeIndex].customer_profile?.name}
                    className="w-10 h-10 rounded-full mr-3 object-cover ring-2 ring-white/30"
                  />
                )}

                <div>
                  <p className={`text-sm font-medium ${textClass}`}>
                    {testimonials[activeIndex].customer_profile?.name}
                  </p>
                  {showCompany &&
                    testimonials[activeIndex].customer_profile?.title &&
                    testimonials[activeIndex].customer_profile?.company && (
                      <p className={`text-xs ${subtextClass}`}>
                        {testimonials[activeIndex].customer_profile?.title},{" "}
                        {testimonials[activeIndex].customer_profile?.company}
                      </p>
                    )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3">
          <div className="flex gap-1">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? `w-6`
                    : darkMode
                      ? "bg-slate-600/50"
                      : "bg-slate-300/80"
                }`}
                onClick={() => {
                  setDirection(index > activeIndex ? 1 : -1);
                  setActiveIndex(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
                style={{
                  backgroundColor: index === activeIndex ? highlightColor : "",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-1.5 rounded-full transition-colors ${
                darkMode
                  ? isAutoPlaying
                    ? "bg-slate-700 text-white"
                    : "bg-slate-800 text-slate-400"
                  : isAutoPlaying
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-100 text-slate-400"
              }`}
              aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
            >
              {isAutoPlaying ? (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={handlePrevious}
              className={`p-1.5 rounded-full transition-colors ${
                darkMode
                  ? "bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
              aria-label="Previous testimonial"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className={`p-1.5 rounded-full transition-colors ${
                darkMode
                  ? "bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
              aria-label="Next testimonial"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MinimalCardWidget - A clean, minimalist design that works well in any context
 */
export const MinimalCardWidget: React.FC<WidgetProps> = ({
  testimonial,
  customizations,
}) => {
  // Extract testimonial content
  const testimonialText = getTestimonialContent(testimonial);

  // Handle customizations with defaults
  const {
    darkMode = false,
    rounded = "lg",
    showAvatar = true,
    showRating = true,
    showCompany = true,
    highlightColor = "#3b82f6",
    shadow = "md",
    border = true,
    textAlign = "left",
    width = "full",
    animation = "none",
    fontStyle = "modern",
  } = customizations;

  // Generate dynamic classes
  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${getRoundedClass(rounded)} ${getShadowClass(shadow)}`;
  const borderClass = border
    ? darkMode
      ? "border border-slate-700"
      : "border border-slate-200"
    : "";
  const bgClass = darkMode ? "bg-slate-800" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-slate-900";
  const secondaryTextClass = darkMode ? "text-slate-400" : "text-slate-500";
  const fontStyleClass = getFontClass(fontStyle);

  // Handle width classes
  const widthClass =
    width === "full"
      ? "w-full"
      : width === "md"
        ? "max-w-md mx-auto"
        : width === "lg"
          ? "max-w-lg mx-auto"
          : "max-w-xl mx-auto";

  // Define animation variants
  const cardVariants = {
    initial: {
      opacity: 0,
      y: animation === "fade" ? 0 : 20,
      scale: animation === "zoom" ? 0.95 : 1,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  // Default placeholder avatar URL
  const defaultAvatar = "https://randomuser.me/api/portraits/women/68.jpg";

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={cardVariants}
      className={`${baseClasses} ${bgClass} ${borderClass} ${widthClass}`}
    >
      <div className={`p-6 ${textAlign === "center" ? "text-center" : ""}`}>
        {showRating && testimonial?.rating && (
          <div className="mb-4">
            <StarRating
              rating={testimonial.rating}
              color={highlightColor}
              darkMode={darkMode}
            />
          </div>
        )}

        <blockquote className="mb-4">
          <p
            className={`text-sm ${textClass} ${fontStyleClass} leading-relaxed`}
          >
            {testimonialText}
          </p>
        </blockquote>

        <div
          className={`flex items-center ${textAlign === "center" ? "justify-center" : ""}`}
        >
          {showAvatar && testimonial?.customer_profile?.avatar_url && (
            <img
              src={testimonial.customer_profile.avatar_url || defaultAvatar}
              alt={testimonial.customer_profile.name}
              className="w-10 h-10 rounded-full mr-3 object-cover ring-2"
              style={{ color: `${highlightColor}30` }}
            />
          )}

          <div>
            <p className={`text-sm font-medium ${textClass}`}>
              {testimonial?.customer_profile?.name}
            </p>
            {showCompany &&
              testimonial?.customer_profile?.title &&
              testimonial?.customer_profile?.company && (
                <p className={`text-xs ${secondaryTextClass}`}>
                  {testimonial.customer_profile.title},{" "}
                  {testimonial.customer_profile.company}
                </p>
              )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * VideoPlayerWidget - Premium video testimonial player
 */
export const VideoPlayerWidget: React.FC<WidgetProps> = ({
  testimonial,
  customizations,
}) => {
  // Local state for video player
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [showControls, setShowControls] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle customizations with defaults
  const {
    darkMode = true,
    rounded = "lg",
    showAvatar = true,
    showRating = true,
    showCompany = true,
    highlightColor = "#3b82f6",
    shadow = "xl",
    border = false,
    textAlign = "left",
  } = customizations;

  // Default placeholder avatar URL
  const defaultAvatar = "https://randomuser.me/api/portraits/men/42.jpg";

  // Ensure we have a video testimonial
  if (!testimonial || testimonial.format !== "video") {
    return (
      <div
        className={`rounded-lg bg-slate-800 text-white p-6 text-center ${getRoundedClass(rounded)}`}
      >
        <svg
          className="w-12 h-12 mx-auto mb-4 text-slate-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 4h-14c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-8 11c0 .55-.45 1-1 1h-2v-2h2c.55 0 1 .45 1 1zm1-4c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v3zm4 3c0 .55-.45 1-1 1h-2v-2h2c.55 0 1 .45 1 1zm3-3c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v3z" />
        </svg>
        <p className="text-sm">Video testimonial not available</p>
      </div>
    );
  }

  // Generate dynamic classes
  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${getRoundedClass(rounded)} ${getShadowClass(shadow)}`;
  const borderClass = border
    ? darkMode
      ? "border border-slate-700"
      : "border border-slate-200"
    : "";

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setProgress((currentTime / duration) * 100);
    }
  };

  // Handle video progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const clickPosition =
        (e.clientX - progressBar.getBoundingClientRect().left) /
        progressBar.offsetWidth;
      const newTime = clickPosition * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
    }
  };

  // For demonstration purposes, use a real video for the example
  const videoUrl =
    testimonial.media_url ||
    "https://player.vimeo.com/progressive_redirect/playback/194837908/rendition/540p/file.mp4?loc=external&oauth2_token_id=1747418641";
  const videoDuration = testimonial.media_duration || 120; // in seconds
  const thumbnailUrl =
    testimonial.thumbnail_url ||
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop";

  // Convert video duration to mm:ss format
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Calculate current time based on progress
  const currentTime = (progress / 100) * videoDuration;

  return (
    <div className={`${baseClasses} ${borderClass} relative group`}>
      {/* Video player */}
      <div
        className="relative aspect-video bg-black"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Thumbnail with play button when not playing */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            <button
              className="relative z-10 w-20 h-20 rounded-full bg-black bg-opacity-50 flex items-center justify-center group"
              onClick={togglePlay}
            >
              <div
                className="absolute inset-0 rounded-full opacity-30 animate-ping"
                style={{ backgroundColor: highlightColor }}
              ></div>
              <svg
                className="w-10 h-10 text-white group-hover:scale-110 transition-transform"
                style={{ fill: "white" }}
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* Actual video */}
        <video
          ref={videoRef}
          className="w-full h-full"
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />

        {/* Video controls overlay - only visible on hover or mobile */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls || !isPlaying
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {/* Progress bar */}
          <div
            className="w-full h-1 bg-gray-600 rounded-full mb-3 relative cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: highlightColor,
              }}
            ></div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="text-white hover:text-opacity-80 transition-opacity"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="text-xs text-white font-medium">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <button
                  className="text-white hover:text-opacity-80 transition-opacity"
                  onClick={() => handleVolumeChange(volume === 0 ? 0.5 : 0)}
                >
                  {volume === 0 ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="ml-2 w-20 accent-white"
                />
              </div>

              <button className="text-white hover:text-opacity-80 transition-opacity">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Author info section below video */}
      <div
        className={`p-4 bg-slate-900 text-white ${textAlign === "center" ? "text-center" : ""}`}
      >
        <div
          className={`flex items-center ${textAlign === "center" ? "justify-center" : ""}`}
        >
          {showAvatar && testimonial?.customer_profile?.avatar_url && (
            <img
              src={testimonial.customer_profile.avatar_url || defaultAvatar}
              alt={testimonial.customer_profile.name}
              className="w-10 h-10 rounded-full mr-3 object-cover ring-2 ring-white/20"
            />
          )}

          <div>
            <p className="text-sm font-medium text-white">
              {testimonial?.customer_profile?.name}
            </p>
            {showCompany &&
              testimonial?.customer_profile?.title &&
              testimonial?.customer_profile?.company && (
                <p className="text-xs text-slate-400">
                  {testimonial.customer_profile.title},{" "}
                  {testimonial.customer_profile.company}
                </p>
              )}
          </div>

          {showRating && testimonial?.rating && (
            <div className="ml-auto">
              <StarRating
                rating={testimonial.rating}
                size="w-4 h-4"
                color={highlightColor}
                darkMode={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
