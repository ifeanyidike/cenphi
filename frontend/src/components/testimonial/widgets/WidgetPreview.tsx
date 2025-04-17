// components/WidgetPreview.tsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Testimonial } from "@/types/testimonial";
interface BrowserPreviewProps {
  widgetType: string;
  testimonial: Testimonial | null;
  customizations: {
    theme: string;
    darkMode: boolean;
    rounded: string;
    showAvatar: boolean;
    showRating: boolean;
    showCompany: boolean;
    animation: string;
    position: string;
    autoRotate: boolean;
    highlightColor: string;
    fontStyle: string;
    width: string;
    border: boolean;
    shadow: string;
  };
}

export const BrowserPreview: React.FC<BrowserPreviewProps> = ({
  widgetType,
  testimonial,
  customizations,
}) => {
  if (!testimonial) {
    return (
      <div className="flex items-center justify-center h-48 text-center text-sm text-slate-500">
        No testimonial data available for preview
      </div>
    );
  }

  // Select the appropriate widget component based on the widgetType
  switch (widgetType) {
    case "minimal-card":
      return (
        <MinimalCardWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    case "spotlight":
      return (
        <SpotlightWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    case "carousel":
      return (
        <CarouselWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    case "social-media":
      return (
        <SocialMediaWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    case "video-player":
      return (
        <VideoPlayerWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    case "quote-block":
      return (
        <QuoteBlockWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    case "grid-mosaic":
      return (
        <MosaicGridWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    case "floating-bubble":
      return (
        <FloatingBubbleWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
    default:
      return (
        <MinimalCardWidget
          testimonial={testimonial}
          customizations={customizations}
        />
      );
  }
};

// Helper function to get testimonial text content regardless of type
const getTestimonialText = (testimonial: Testimonial): string => {
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

// Helper function to generate dynamic classes based on customizations
const getDynamicClasses = (
  customizations: BrowserPreviewProps["customizations"]
) => {
  // Apply rounded corners based on customization
  const roundedClass =
    {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    }[customizations.rounded] || "rounded-lg";

  // Apply shadow based on customization
  const shadowClass =
    {
      none: "shadow-none",
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl",
    }[customizations.shadow] || "shadow-md";

  // Generate border class
  const borderClass = customizations.border
    ? customizations.darkMode
      ? "border border-slate-700"
      : "border border-slate-200"
    : "";

  return { roundedClass, shadowClass, borderClass };
};

// Helper function to render star ratings
const StarRating: React.FC<{ rating: number; size?: string }> = ({
  rating,
  size = "w-4 h-4",
}) => {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${size} ${i < rating ? "text-yellow-400" : "text-slate-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// The "Minimal Card" widget implementation
const MinimalCardWidget: React.FC<{
  testimonial: Testimonial;
  customizations: BrowserPreviewProps["customizations"];
}> = ({ testimonial, customizations }) => {
  const { roundedClass, shadowClass, borderClass } =
    getDynamicClasses(customizations);
  const testimonialText = getTestimonialText(testimonial);

  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${roundedClass} ${shadowClass} ${borderClass}`;
  const bgClass = customizations.darkMode ? "bg-slate-800" : "bg-white";
  const textClass = customizations.darkMode ? "text-white" : "text-slate-900";

  const secondaryTextClass = customizations.darkMode
    ? "text-slate-400"
    : "text-slate-500";

  return (
    <div
      className={`${baseClasses} ${bgClass}`}
      style={{ maxWidth: customizations.width === "full" ? "100%" : "400px" }}
    >
      <div className="p-6">
        {customizations.showRating && testimonial.rating && (
          <div className="mb-4">
            <StarRating rating={testimonial.rating} />
          </div>
        )}

        <blockquote className="mb-4">
          <p className={`text-sm ${textClass}`}>{testimonialText}</p>
        </blockquote>

        <div className="flex items-center">
          {customizations.showAvatar &&
            testimonial.customer_profile?.avatar_url && (
              <img
                src={testimonial.customer_profile?.avatar_url}
                alt={testimonial.customer_profile?.name}
                className="w-10 h-10 rounded-full mr-3 object-cover"
              />
            )}

          <div>
            <p className={`text-sm font-medium ${textClass}`}>
              {testimonial.customer_profile?.name}
            </p>
            {customizations.showCompany &&
              testimonial.customer_profile?.title &&
              testimonial.customer_profile?.company && (
                <p className={`text-xs ${secondaryTextClass}`}>
                  {testimonial.customer_profile?.title},{" "}
                  {testimonial.customer_profile?.company}
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

// The "Spotlight" widget implementation - a premium featured testimonial display
const SpotlightWidget: React.FC<{
  testimonial: Testimonial;
  customizations: BrowserPreviewProps["customizations"];
}> = ({ testimonial, customizations }) => {
  const { roundedClass, shadowClass, borderClass } =
    getDynamicClasses(customizations);
  const testimonialText = getTestimonialText(testimonial);

  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${roundedClass} ${shadowClass} ${borderClass}`;
  const bgClass = customizations.darkMode ? "bg-slate-800" : "bg-white";
  const textClass = customizations.darkMode ? "text-white" : "text-slate-900";
  const subtextClass = customizations.darkMode
    ? "text-slate-300"
    : "text-slate-600";
  const accentColor = customizations.highlightColor;

  // Animation variants based on customizations.animation
  const contentVariants = {
    initial: {
      opacity: 0,
      y: customizations.animation === "fade" ? 0 : 20,
      scale: customizations.animation === "zoom" ? 0.95 : 1,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div
      className={`${baseClasses} ${bgClass} relative overflow-hidden`}
      style={{ maxWidth: customizations.width === "full" ? "100%" : "600px" }}
    >
      {/* Decorative spotlight effect */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
        }}
      ></div>

      <div className="relative p-8">
        {/* Quote icon */}
        <div
          className="w-12 h-12 flex items-center justify-center rounded-full mb-6"
          style={{ backgroundColor: `${accentColor}10` }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: accentColor }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={contentVariants}
        >
          {customizations.showRating && testimonial.rating && (
            <div className="mb-4">
              <StarRating rating={testimonial.rating} size="w-5 h-5" />
            </div>
          )}

          <blockquote className="mb-6">
            <p className={`text-xl font-medium leading-relaxed ${textClass}`}>
              "{testimonialText}"
            </p>
          </blockquote>

          <div className="flex items-center">
            {customizations.showAvatar &&
              testimonial.customer_profile?.avatar_url && (
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full opacity-50 blur-sm"
                    style={{ backgroundColor: accentColor }}
                  ></div>
                  <img
                    src={testimonial.customer_profile?.avatar_url}
                    alt={testimonial.customer_profile?.name}
                    className="relative w-14 h-14 rounded-full mr-4 object-cover border-2 border-white"
                  />
                </div>
              )}

            <div>
              <p className={`text-lg font-medium ${textClass}`}>
                {testimonial.customer_profile?.name}
              </p>
              {customizations.showCompany &&
                testimonial.customer_profile?.title &&
                testimonial.customer_profile?.company && (
                  <p className={`text-sm ${subtextClass}`}>
                    {testimonial.customer_profile?.title},{" "}
                    {testimonial.customer_profile?.company}
                  </p>
                )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// The "Carousel" widget implementation - for showing multiple testimonials
const CarouselWidget: React.FC<{
  testimonial: Testimonial;
  customizations: BrowserPreviewProps["customizations"];
}> = ({ testimonial, customizations }) => {
  // For preview purposes, we'll duplicate the testimonial to simulate multiple items
  const testimonials = [testimonial];

  const [activeIndex, setActiveIndex] = React.useState(0);
  const { roundedClass, shadowClass, borderClass } =
    getDynamicClasses(customizations);

  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${roundedClass} ${shadowClass} ${borderClass}`;
  const bgClass = customizations.darkMode ? "bg-slate-800" : "bg-white";
  const textClass = customizations.darkMode ? "text-white" : "text-slate-900";
  const subtextClass = customizations.darkMode
    ? "text-slate-300"
    : "text-slate-600";
  const accentColor = customizations.highlightColor;

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <div
      className={`${baseClasses} ${bgClass}`}
      style={{ maxWidth: customizations.width === "full" ? "100%" : "500px" }}
    >
      <div className="relative">
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={1}>
            <motion.div
              key={activeIndex}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="p-6"
            >
              {customizations.showRating &&
                testimonials[activeIndex].rating && (
                  <div className="mb-3">
                    <StarRating rating={testimonials[activeIndex].rating} />
                  </div>
                )}

              <blockquote className="mb-4">
                <p className={`text-sm ${textClass}`}>
                  {getTestimonialText(testimonials[activeIndex])}
                </p>
              </blockquote>

              <div className="flex items-center">
                {customizations.showAvatar &&
                  testimonials[activeIndex].customer_profile?.avatar_url && (
                    <img
                      src={
                        testimonials[activeIndex].customer_profile?.avatar_url
                      }
                      alt={testimonials[activeIndex].customer_profile?.name}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                  )}

                <div>
                  <p className={`text-sm font-medium ${textClass}`}>
                    {testimonials[activeIndex].customer_profile?.name}
                  </p>
                  {customizations.showCompany &&
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
        <div className="flex justify-center mt-4 gap-1">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex
                  ? "w-6 bg-blue-600"
                  : customizations.darkMode
                    ? "bg-slate-600"
                    : "bg-slate-300"
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              style={{
                backgroundColor: index === activeIndex ? accentColor : "",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Implementation of the Social Media Card widget
const SocialMediaWidget: React.FC<{
  testimonial: Testimonial;
  customizations: BrowserPreviewProps["customizations"];
}> = ({ testimonial, customizations }) => {
  const { shadowClass, borderClass } = getDynamicClasses(customizations);
  const testimonialText = getTestimonialText(testimonial);

  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${shadowClass} ${borderClass} rounded-xl`;
  const bgClass = customizations.darkMode ? "bg-slate-800" : "bg-white";
  const textClass = customizations.darkMode ? "text-white" : "text-slate-900";
  const secondaryTextClass = customizations.darkMode
    ? "text-slate-400"
    : "text-slate-500";

  // Select a social platform icon based on the testimonial source
  const getPlatformIcon = () => {
    switch ((testimonial.custom_fields?.source as string)?.toLowerCase()) {
      case "facebook":
        return (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case "twitter":
        return (
          <svg
            className="w-5 h-5 text-blue-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 14-7.496 14-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59l-.047-.02z" />
          </svg>
        );
      case "instagram":
        return (
          <svg
            className="w-5 h-5 text-pink-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg
            className="w-5 h-5 text-blue-700"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-slate-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`${baseClasses} ${bgClass}`}
      style={{ maxWidth: customizations.width === "full" ? "100%" : "400px" }}
    >
      {/* Header section with user and platform */}
      <div
        className={`p-4 border-b ${customizations.darkMode ? "border-slate-700" : "border-slate-200"} flex items-center justify-between`}
      >
        <div className="flex items-center">
          {customizations.showAvatar &&
            testimonial.customer_profile?.avatar_url && (
              <img
                src={testimonial.customer_profile?.avatar_url}
                alt={testimonial.customer_profile?.name}
                className="w-10 h-10 rounded-full mr-3 object-cover"
              />
            )}

          <div>
            <p className={`text-sm font-medium ${textClass}`}>
              {testimonial.customer_profile?.name}
            </p>
            {customizations.showCompany &&
              testimonial.customer_profile?.title &&
              testimonial.customer_profile?.company && (
                <p className={`text-xs ${secondaryTextClass}`}>
                  {testimonial.customer_profile?.title},{" "}
                  {testimonial.customer_profile?.company}
                </p>
              )}
          </div>
        </div>

        <div>{getPlatformIcon()}</div>
      </div>

      {/* Content section */}
      <div className="p-4">
        <p className={`text-sm mb-4 ${textClass}`}>{testimonialText}</p>

        {customizations.showRating && testimonial.rating && (
          <div className="mb-2">
            <StarRating rating={testimonial.rating} />
          </div>
        )}
      </div>

      {/* Footer with interactions */}
      <div
        className={`px-4 py-3 border-t ${customizations.darkMode ? "border-slate-700" : "border-slate-200"} flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          <button
            className={`flex items-center gap-1 ${secondaryTextClass} hover:opacity-80`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-xs">0</span>
          </button>

          <button
            className={`flex items-center gap-1 ${secondaryTextClass} hover:opacity-80`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM17 14H7c-.55 0-1-.45-1-1s.45-1 1-1h10c.55 0 1 .45 1 1s-.45 1-1 1zm0-3H7c-.55 0-1-.45-1-1s.45-1 1-1h10c.55 0 1 .45 1 1s-.45 1-1 1zm0-3H7c-.55 0-1-.45-1-1s.45-1 1-1h10c.55 0 1 .45 1 1s-.45 1-1 1z" />
            </svg>
            <span className="text-xs">Comment</span>
          </button>
        </div>

        <button className={`${secondaryTextClass} hover:opacity-80`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Implementation of the Quote Block widget
const QuoteBlockWidget: React.FC<{
  testimonial: Testimonial;
  customizations: BrowserPreviewProps["customizations"];
}> = ({ testimonial, customizations }) => {
  const { roundedClass, shadowClass, borderClass } =
    getDynamicClasses(customizations);
  const testimonialText = getTestimonialText(testimonial);

  const baseClasses = `w-full overflow-hidden transition-all duration-300 ${roundedClass} ${shadowClass} ${borderClass}`;
  const bgClass = customizations.darkMode ? "bg-slate-800" : "bg-white";
  const textClass = customizations.darkMode ? "text-white" : "text-slate-900";
  const subtextClass = customizations.darkMode
    ? "text-slate-300"
    : "text-slate-600";
  const accentColor = customizations.highlightColor;

  return (
    <div
      className={`${baseClasses} ${bgClass} relative`}
      style={{ maxWidth: customizations.width === "full" ? "100%" : "500px" }}
    >
      {/* Large quote mark */}
      <div
        className="absolute top-6 left-6 opacity-15 transform -translate-x-1/2 -translate-y-1/2"
        style={{ color: accentColor }}
      >
        <svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      <div className="p-6 pt-10">
        {customizations.showRating && testimonial.rating && (
          <div className="mb-3">
            <StarRating rating={testimonial.rating} />
          </div>
        )}

        <blockquote className="mb-6 relative z-10">
          <p className={`text-lg italic leading-relaxed ${textClass}`}>
            "{testimonialText}"
          </p>
        </blockquote>

        <div
          className="h-1 w-16 mb-4 rounded"
          style={{ backgroundColor: accentColor }}
        ></div>

        <div className="flex items-center">
          {customizations.showAvatar &&
            testimonial.customer_profile?.avatar_url && (
              <img
                src={testimonial.customer_profile?.avatar_url}
                alt={testimonial.customer_profile?.name}
                className="w-12 h-12 rounded-full mr-4 object-cover"
              />
            )}

          <div>
            <p className={`font-medium ${textClass}`}>
              {testimonial.customer_profile?.name}
            </p>
            {customizations.showCompany &&
              testimonial.customer_profile?.title &&
              testimonial.customer_profile?.company && (
                <p className={`text-sm ${subtextClass}`}>
                  {testimonial.customer_profile?.title},{" "}
                  {testimonial.customer_profile?.company}
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder for the remaining widget implementations
const VideoPlayerWidget: React.FC<{
  testimonial: Testimonial;
  customizations: any;
}> = () => {
  // In the preview, we'll just show a simple video placeholder
  return (
    <div className="flex justify-center items-center h-60 bg-slate-900 rounded-lg">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <p className="text-white text-sm">Video Testimonial Player</p>
        <p className="text-slate-400 text-xs mt-1">
          Click "Customize Widget" to configure
        </p>
      </div>
    </div>
  );
};

// Mosaic Grid Widget (simplified for preview)
const MosaicGridWidget: React.FC<{
  testimonial: Testimonial;
  customizations: any;
}> = ({ testimonial, customizations }) => {
  // For preview, we'll create a simple grid with duplicated testimonials
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`p-3 rounded-lg ${
            customizations.darkMode
              ? "bg-slate-800"
              : "bg-white border border-slate-200"
          }`}
        >
          {customizations.showRating && testimonial.rating && (
            <div className="mb-2">
              <StarRating rating={testimonial.rating} size="w-3 h-3" />
            </div>
          )}

          <p
            className={`text-xs mb-2 line-clamp-3 ${
              customizations.darkMode ? "text-white" : "text-slate-700"
            }`}
          >
            {getTestimonialText(testimonial).substring(0, 60)}...
          </p>

          <div className="flex items-center">
            {customizations.showAvatar &&
              testimonial.customer_profile?.avatar_url && (
                <img
                  src={testimonial.customer_profile?.avatar_url}
                  alt={testimonial.customer_profile?.name}
                  className="w-6 h-6 rounded-full mr-2 object-cover"
                />
              )}

            <span
              className={`text-xs font-medium ${
                customizations.darkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              {testimonial.customer_profile?.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Floating Bubble Widget (simplified for preview)
const FloatingBubbleWidget: React.FC<{
  testimonial: Testimonial;
  customizations: any;
}> = ({ testimonial, customizations }) => {
  const accentColor = customizations.highlightColor;

  return (
    <div className="relative h-48 bg-transparent">
      <div
        className={`absolute bottom-0 right-0 max-w-xs p-4 rounded-lg shadow-lg ${
          customizations.darkMode ? "bg-slate-800" : "bg-white"
        }`}
        style={{
          boxShadow: `0 0 15px 0 ${accentColor}20`,
        }}
      >
        <div className="flex items-start mb-3">
          {customizations.showAvatar &&
            testimonial.customer_profile?.avatar_url && (
              <img
                src={testimonial.customer_profile?.avatar_url}
                alt={testimonial.customer_profile?.name}
                className="w-10 h-10 rounded-full mr-3 object-cover"
              />
            )}

          <div>
            <p
              className={`text-sm font-medium ${
                customizations.darkMode ? "text-white" : "text-slate-800"
              }`}
            >
              {testimonial.customer_profile?.name}
            </p>

            {customizations.showCompany &&
              testimonial.customer_profile?.title &&
              testimonial.customer_profile?.company && (
                <p
                  className={`text-xs ${
                    customizations.darkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {testimonial.customer_profile?.title}
                </p>
              )}
          </div>

          <button className="ml-auto">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p
          className={`text-sm ${
            customizations.darkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {getTestimonialText(testimonial).substring(0, 90)}...
        </p>

        <div className="flex justify-between items-center mt-3">
          {customizations.showRating && testimonial.rating && (
            <StarRating rating={testimonial.rating} size="w-3 h-3" />
          )}

          <button
            className="text-xs px-3 py-1 rounded"
            style={{
              backgroundColor: accentColor,
              color: "white",
            }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};
