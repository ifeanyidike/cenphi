import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SpotlightWidget,
  CarouselWidget,
  MinimalCardWidget,
  VideoPlayerWidget,
} from "./widget-components";

/**
 * WidgetShowcase - A demonstration of all widget types in various configurations
 * This component serves as both documentation and a live demo
 */
const WidgetShowcase = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sample testimonials for demonstration
  const sampleTestimonials = {
    text: {
      id: "sample-text-testimonial",
      type: "text",
      createdAt: "2025-03-15T12:00:00Z",
      updatedAt: "2025-03-15T12:00:00Z",
      author: {
        name: "Sarah Johnson",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        title: "Marketing Director",
        company: "Acme Corp",
      },
      source: "website",
      rating: 5,
      content: {
        type: "text",
        text: "The product completely transformed our workflow. We've seen a 40% increase in productivity and our team is more engaged than ever. The customer support has been exceptional — they're always responsive and have gone above and beyond to ensure our success.",
      },
      metadata: {
        views: 1245,
        shares: 89,
        likes: 321,
        verified: true,
        featured: true,
        tags: ["product", "productivity", "support"],
      },
    },
    video: {
      id: "sample-video-testimonial",
      type: "video",
      createdAt: "2025-02-20T15:30:00Z",
      updatedAt: "2025-02-20T15:30:00Z",
      author: {
        name: "Michael Chen",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
        title: "CTO",
        company: "Tech Innovations Inc.",
      },
      source: "zoom",
      rating: 5,
      content: {
        type: "video",
        url: "https://player.vimeo.com/external/194837908.sd.mp4?s=c350076905b78c67f74d7ee39fdb4fef01d12420&profile_id=164",
        thumbnail:
          "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800&auto=format&fit=crop",
        duration: 143,
        transcript:
          "As the CTO of a growing tech company, I was skeptical about adopting new software. But this platform has exceeded all expectations. The integration was seamless, and we were up and running in days, not weeks. Our development team productivity has improved by at least 35%, and we've eliminated numerous bottlenecks in our workflow.",
      },
      metadata: {
        views: 3782,
        shares: 215,
        likes: 943,
        verified: true,
        featured: true,
        tags: ["tech", "software", "productivity"],
      },
    },
  };

  // Widget examples with different configurations
  const widgetExamples = [
    {
      type: "spotlight",
      name: "Premium Spotlight",
      description: "Elegant featured testimonial with premium design elements",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "premium",
        darkMode: false,
        rounded: "xl",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "fade",
        highlightColor: "#6366f1",
        fontStyle: "modern",
        shadow: "xl",
        border: true,
        textAlign: "left",
      },
    },
    {
      type: "spotlight",
      name: "Minimalist Spotlight",
      description: "Clean, elegant design with minimal distractions",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "minimal",
        darkMode: false,
        rounded: "lg",
        showAvatar: true,
        showRating: false,
        showCompany: true,
        animation: "fade",
        highlightColor: "#10b981",
        fontStyle: "modern",
        shadow: "md",
        border: false,
        textAlign: "left",
      },
    },
    {
      type: "spotlight",
      name: "Dark Spotlight",
      description: "Premium dark theme with vibrant accents",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "premium",
        darkMode: true,
        rounded: "xl",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "fade",
        highlightColor: "#8b5cf6",
        fontStyle: "modern",
        shadow: "xl",
        border: true,
        textAlign: "left",
      },
    },
    {
      type: "carousel",
      name: "Standard Carousel",
      description: "Showcase multiple testimonials with elegant transitions",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "modern",
        darkMode: false,
        rounded: "lg",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "slide",
        autoRotate: true,
        highlightColor: "#3b82f6",
        fontStyle: "modern",
        shadow: "md",
        border: true,
        textAlign: "left",
      },
    },
    {
      type: "carousel",
      name: "Centered Carousel",
      description: "Centered layout with elegant typography",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "elegant",
        darkMode: false,
        rounded: "lg",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "fade",
        autoRotate: true,
        highlightColor: "#f43f5e",
        fontStyle: "serif",
        shadow: "lg",
        border: true,
        textAlign: "center",
      },
    },
    {
      type: "carousel",
      name: "Dark Carousel",
      description: "Dark theme carousel with modern styling",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "modern",
        darkMode: true,
        rounded: "xl",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "slide",
        autoRotate: true,
        highlightColor: "#06b6d4",
        fontStyle: "modern",
        shadow: "none",
        border: true,
        textAlign: "left",
      },
    },
    {
      type: "minimal-card",
      name: "Clean Card",
      description: "Simple, clean design that fits anywhere",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "modern",
        darkMode: false,
        rounded: "lg",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "none",
        highlightColor: "#3b82f6",
        fontStyle: "modern",
        shadow: "md",
        border: true,
        textAlign: "left",
      },
    },
    {
      type: "minimal-card",
      name: "Quote Card",
      description: "Focus on the testimonial text with minimal styling",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "minimal",
        darkMode: false,
        rounded: "lg",
        showAvatar: true,
        showRating: false,
        showCompany: true,
        animation: "none",
        highlightColor: "#10b981",
        fontStyle: "serif",
        shadow: "sm",
        border: true,
        textAlign: "left",
      },
    },
    {
      type: "minimal-card",
      name: "Dark Card",
      description: "Sleek dark theme minimal card",
      testimonial: sampleTestimonials.text,
      customizations: {
        theme: "dark",
        darkMode: true,
        rounded: "xl",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "fade",
        highlightColor: "#8b5cf6",
        fontStyle: "modern",
        shadow: "md",
        border: false,
        textAlign: "left",
      },
    },
    {
      type: "video-player",
      name: "Video Testimonial",
      description: "Premium video player with professional controls",
      testimonial: sampleTestimonials.video,
      customizations: {
        theme: "dark",
        darkMode: true,
        rounded: "lg",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "fade",
        highlightColor: "#6366f1",
        fontStyle: "modern",
        shadow: "xl",
        border: false,
        textAlign: "left",
      },
    },
    {
      type: "video-player",
      name: "Light Video Player",
      description: "Clean video player with light theme",
      testimonial: sampleTestimonials.video,
      customizations: {
        theme: "modern",
        darkMode: false,
        rounded: "lg",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "zoom",
        highlightColor: "#3b82f6",
        fontStyle: "modern",
        shadow: "lg",
        border: true,
        textAlign: "left",
      },
    },
  ];

  // // Get widget component by type
  // const getWidgetComponent = (type) => {
  //   switch (type) {
  //     case "spotlight":
  //       return SpotlightWidget;
  //     case "carousel":
  //       return CarouselWidget;
  //     case "minimal-card":
  //       return MinimalCardWidget;
  //     case "video-player":
  //       return VideoPlayerWidget;
  //     default:
  //       return MinimalCardWidget;
  //   }
  // };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
    >
      {/* Header */}
      <header
        className={`py-6 px-6 border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"} sticky top-0 z-10 ${isDarkMode ? "bg-slate-900" : "bg-white"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-2 mr-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Widget Showcase</h1>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Interactive examples of premium testimonial widgets
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${
                isDarkMode
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              } transition-colors`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
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
            </button>
          </div>
        </div>
      </header>

      {/* Intro Section */}
      <section
        className={`py-12 px-6 ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className={`text-3xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Premium Testimonial Widgets
            </h2>
            <p
              className={`text-lg mb-8 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
            >
              Showcase customer testimonials with beautiful, customizable
              widgets that convert visitors into customers.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#spotlight-widgets"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Spotlight Widgets
              </a>
              <a
                href="#carousel-widgets"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Carousel Widgets
              </a>
              <a
                href="#card-widgets"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Card Widgets
              </a>
              <a
                href="#video-widgets"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Video Widgets
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Widget Sections */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          {/* Spotlight Widgets */}
          <div id="spotlight-widgets">
            <div className="max-w-3xl mx-auto mb-10">
              <h2
                className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Spotlight Widgets
              </h2>
              <p
                className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                Showcase your most important testimonials with elegant,
                attention-grabbing spotlight widgets. Perfect for hero sections
                and landing pages.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {widgetExamples
                .filter((example) => example.type === "spotlight")
                .map((example, index) => (
                  <WidgetExampleCard
                    key={`spotlight-${index}`}
                    example={example}
                    isDarkMode={isDarkMode}
                  />
                ))}
            </div>
          </div>

          {/* Carousel Widgets */}
          <div id="carousel-widgets">
            <div className="max-w-3xl mx-auto mb-10">
              <h2
                className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Carousel Widgets
              </h2>
              <p
                className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                Display multiple testimonials in a space-efficient carousel with
                smooth transitions. Perfect for showcasing a collection of
                customer stories.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {widgetExamples
                .filter((example) => example.type === "carousel")
                .map((example, index) => (
                  <WidgetExampleCard
                    key={`carousel-${index}`}
                    example={example}
                    isDarkMode={isDarkMode}
                  />
                ))}
            </div>
          </div>

          {/* Card Widgets */}
          <div id="card-widgets">
            <div className="max-w-3xl mx-auto mb-10">
              <h2
                className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Card Widgets
              </h2>
              <p
                className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                Clean, minimal card designs that fit perfectly anywhere on your
                site. Versatile and elegant for any context.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {widgetExamples
                .filter((example) => example.type === "minimal-card")
                .map((example, index) => (
                  <WidgetExampleCard
                    key={`card-${index}`}
                    example={example}
                    isDarkMode={isDarkMode}
                  />
                ))}
            </div>
          </div>

          {/* Video Widgets */}
          <div id="video-widgets">
            <div className="max-w-3xl mx-auto mb-10">
              <h2
                className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Video Widgets
              </h2>
              <p
                className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                Showcase powerful video testimonials with our premium video
                player widgets. Designed for maximum engagement.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {widgetExamples
                .filter((example) => example.type === "video-player")
                .map((example, index) => (
                  <WidgetExampleCard
                    key={`video-${index}`}
                    example={example}
                    isDarkMode={isDarkMode}
                  />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-20 px-6 ${isDarkMode ? "bg-gradient-to-r from-indigo-900/40 to-purple-900/40" : "bg-gradient-to-r from-indigo-50 to-purple-50"}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className={`text-3xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Ready to boost conversions with powerful testimonials?
          </h2>
          <p
            className={`text-lg mb-8 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
          >
            Start creating your custom testimonial widgets today with our
            easy-to-use Widget Studio.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-base font-medium">
              Get Started
            </button>
            <button
              className={`px-6 py-3 rounded-lg text-base font-medium ${
                isDarkMode
                  ? "bg-slate-800 text-white hover:bg-slate-700"
                  : "bg-white text-indigo-600 hover:bg-slate-50"
              } transition-colors border ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
            >
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

/**
 * WidgetExampleCard - Display a widget example with its name and description
 */
const WidgetExampleCard = ({ example, isDarkMode }: any) => {
  const [isCodeVisible, setIsCodeVisible] = useState(false);

  // Get the appropriate widget component
  const WidgetComponent = getWidgetComponent(example.type);

  // Generate example code
  const generateCode = () => {
    return `<div 
  class="testimonial-widget"
  data-widget-type="${example.type}"
  data-testimonial-id="${example.testimonial?.id || "testimonial-id"}"
  data-theme="${example.customizations.theme}"
  data-dark-mode="${example.customizations.darkMode}"
  data-rounded="${example.customizations.rounded}"
  data-show-avatar="${example.customizations.showAvatar}"
  data-show-rating="${example.customizations.showRating}"
  data-show-company="${example.customizations.showCompany}"
  data-animation="${example.customizations.animation}"
  data-highlight-color="${example.customizations.highlightColor}"
  data-font-style="${example.customizations.fontStyle}"
  data-shadow="${example.customizations.shadow}"
  data-border="${example.customizations.border}"
  data-text-align="${example.customizations.textAlign}"
  ${example.type === "carousel" ? `data-auto-rotate="${example.customizations.autoRotate}"` : ""}
>
</div>
<script src="https://cdn.example.com/testimonial-widgets.js"></script>`;
  };

  return (
    <div
      className={`rounded-xl overflow-hidden border ${
        isDarkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-slate-200"
      } shadow-sm`}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h3
              className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              {example.name}
            </h3>
            <p
              className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              {example.description}
            </p>
          </div>

          <div
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              example.customizations.darkMode
                ? "bg-slate-700 text-slate-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {example.customizations.darkMode ? "Dark Theme" : "Light Theme"}
          </div>
        </div>
      </div>

      <div
        className={`p-6 ${
          example.customizations.darkMode ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        <WidgetComponent
          testimonial={example.testimonial}
          customizations={example.customizations}
        />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
              example.type === "spotlight"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                : example.type === "carousel"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : example.type === "video-player"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
            }`}
          >
            {example.type
              .split("-")
              .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </span>

          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
              isDarkMode
                ? "bg-slate-700 text-slate-300"
                : "bg-slate-100 text-slate-700"
            }`}
            style={{ color: example.customizations.highlightColor }}
          >
            {example.customizations.highlightColor}
          </span>
        </div>

        <button
          onClick={() => setIsCodeVisible(!isCodeVisible)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
            isDarkMode
              ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          } transition-colors`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          {isCodeVisible ? "Hide Code" : "View Code"}
        </button>
      </div>

      <AnimatePresence>
        {isCodeVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className={`p-4 border-t ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"} overflow-x-auto`}
            >
              <pre
                className={`text-xs p-4 rounded ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-800"}`}
              >
                {generateCode()}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Get widget component by type
 */
const getWidgetComponent = (type: any) => {
  switch (type) {
    case "spotlight":
      return SpotlightWidget;
    case "carousel":
      return CarouselWidget;
    case "minimal-card":
      return MinimalCardWidget;
    case "video-player":
      return VideoPlayerWidget;
    default:
      return MinimalCardWidget;
  }
};

export default WidgetShowcase;
