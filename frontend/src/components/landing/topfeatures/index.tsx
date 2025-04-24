import { useEffect, useRef, useState } from "react";
import { ArrowRight, Quote, Award, Sparkles, ChevronRight } from "lucide-react";
import { features } from "./data";
import AnalyticsSection from "./AnalyticsSection";
import AITranscriptionSection from "./AITranscriptionSection";
import SementicSearchSection from "./SemanticSearchSection";
import VideoSection from "./VideoSection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const FeatureSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeSubFeature, setActiveSubFeature] = useState<number>(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<any>({});
  useEffect(() => {
    setActiveSubFeature(0);
  }, [activeFeature]);

  // Update tab indicator position
  useEffect(() => {
    if (tabRefs.current[activeFeature]) {
      const tab = tabRefs.current[activeFeature];
      const left = tab.offsetLeft;
      const width = tab.offsetWidth;
      setIndicatorStyle({ left, width });
    }
  }, [activeFeature]);

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white mx-auto py-16 px-4 overflow-hidden">
      {/* Animation Styles */}
      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-up {
            animation: fadeUp 0.8s ease-out;
          }
        `}
      </style>
      <div className="max-w-screen-xl mx-auto relative">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-amber-500/10 to-pink-500/5 rounded-full blur-3xl"></div>

        {/* Header section with premium styling */}
        <div className="text-center relative mb-20">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-gray-900/5 border border-gray-900/10 backdrop-blur-sm">
            <Award className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700 tracking-wide">
              Your Experience
            </span>
          </div>

          <h2 className="text-5xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-950">
              Elevate Your
            </span>{" "}
            <span className="relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-800">
                Testimonials
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600/40 to-violet-800/40 rounded-full"></span>
            </span>
          </h2>

          <p className="max-w-xl mx-auto text-lg text-gray-600 leading-relaxed mb-8">
            Transform customer stories into compelling marketing assets with our
            premium suite of AI-powered tools.
          </p>

          <div className="w-20 h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mx-auto"></div>
        </div>

        {/* Main showcase with glass effect */}
        <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-2xl shadow-gray-200/50 bg-white backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/90 backdrop-blur-sm"></div>

          {/* Feature tabs at top */}
          <div className="relative pt-8 pb-4 px-8 border-b border-gray-100 flex justify-between">
            <div className="relative flex gap-2 overflow-x-auto">
              {features.map((feature, index) => (
                <button
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    index === activeFeature
                      ? `${feature.accentColor} text-gray-950 shadow-md`
                      : "text-gray-500 hover:text-gray-700 hover:scale-105"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {feature.icon}
                    {feature.title}
                  </span>
                </button>
              ))}
              <div
                className={` absolute bottom-0 h-1 ${features[activeFeature].accentColor}`}
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  transition: "all 0.3s ease-in-out",
                }}
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400"></span>
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
            </div>
          </div>

          {/* Feature showcase content */}
          <div className="relative">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`transition-all duration-500 ${
                  index === activeFeature
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 absolute inset-0 translate-x-8"
                }`}
                style={{ display: index === activeFeature ? "block" : "none" }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-8">
                  {/* Feature description */}
                  <div className="lg:col-span-2 flex flex-col justify-between">
                    <div>
                      <div
                        className={`inline-flex items-center justify-center p-3 mb-6 rounded-xl ${feature.accentColor}`}
                      >
                        {feature.icon}
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {feature.title}
                      </h3>

                      <p className="text-gray-600 leading-relaxed mb-8">
                        {feature.description}
                      </p>

                      {feature.subFeatures ? (
                        <div>
                          <div className="relative flex gap-4 mb-4 overflow-x-auto">
                            {feature.subFeatures.map((sub, idx) => (
                              <Button
                                variant="outline"
                                key={idx}
                                className={cn(
                                  "rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
                                  idx === activeSubFeature
                                    ? "text-indigo-600"
                                    : "text-gray-600 hover:bg-gray-100"
                                )}
                                onClick={() => setActiveSubFeature(idx)}
                              >
                                {sub.title}
                              </Button>
                            ))}
                            <div
                              className="absolute bottom-0 h-0 w-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-indigo-600"
                              style={{
                                transition: "left 0.3s ease-in-out",
                              }}
                            />
                          </div>
                          <div className="p-4 border rounded-xl bg-white/80 shadow-sm">
                            <p className="text-gray-700">
                              {
                                feature.subFeatures[activeSubFeature]
                                  .description
                              }
                            </p>
                            <Benefits
                              benefits={
                                feature.subFeatures[activeSubFeature].benefits
                              }
                              accentColor={feature.accentColor}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="">
                          <Benefits
                            benefits={feature.benefits}
                            accentColor={feature.accentColor}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      className={`self-start flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800 group`}
                    >
                      <span>Explore {feature.title}</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Feature visual representation */}
                  <div className="lg:col-span-3 relative">
                    <div
                      className={`w-full aspect-[1/1] rounded-xl overflow-hidden border ${feature.borderColor} relative`}
                    >
                      {/* Background with accent gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-95`}
                      ></div>

                      {/* Feature-specific visual */}
                      {index === 0 && <AnalyticsSection />}
                      {index === 1 && <AITranscriptionSection />}
                      {index === 2 && <SementicSearchSection />}
                      {index === 3 && <VideoSection />}
                    </div>

                    {/* Testimonial */}
                    <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-100 relative">
                      <div className="absolute -top-4 left-6">
                        <div
                          className={`p-2 rounded-full ${feature.accentColor} shadow-md`}
                        >
                          <Quote className="w-4 h-4 text-gray-700" />
                        </div>
                      </div>

                      <blockquote className="text-gray-700 italic">
                        "The {feature.title.toLowerCase()} functionality has
                        completely transformed how we showcase customer
                        feedback. What used to take hours now happens in minutes
                        with impressive results."
                      </blockquote>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Michael Chen
                          </div>
                          <div className="text-xs text-gray-500">
                            Marketing Director, TechForward
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium CTA section */}
        <div className="mt-16 text-center">
          <button className="relative inline-flex group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative flex items-center gap-2 px-8 py-4 bg-white rounded-lg shadow-xl">
              <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Start your premium experience
              </span>
              <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </button>

          <div className="mt-6 text-sm text-gray-500">
            Join thousands of elite businesses elevating their customer
            testimonials.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;

const animationStyles = {
  shine: {
    animation: "shine 1.2s ease-in-out",
    keyframes: `
          @keyframes shine {
            from { left: -100%; }
            to { left: 100%; }
          }
        `,
  },
  gradientMove: {
    animation: "gradientMove 3s ease infinite",
    backgroundSize: "200% 200%",
    keyframes: `
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `,
  },
  pulse: {
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    keyframes: `
          @keyframes pulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.5; }
          }
        `,
  },
};

const Benefits = ({
  benefits,
  accentColor,
}: {
  benefits: string[];
  accentColor: string;
}) => {
  return (
    <div className="mt-8 mb-10">
      <style>
        {animationStyles.shine.keyframes}
        {animationStyles.gradientMove.keyframes}
        {animationStyles.pulse.keyframes}
      </style>

      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span
          style={{
            backgroundImage: "linear-gradient(to right, #111827, #4B5563)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Premium Benefits
        </span>
        <div
          className="ml-3 h-px flex-grow"
          style={{
            backgroundImage: "linear-gradient(to right, #D1D5DB, transparent)",
          }}
        ></div>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {benefits?.map((benefit, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105"
          >
            {/* Animated gradient border */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))",
                ...animationStyles.gradientMove,
              }}
            ></div>

            {/* Glass content */}
            <div
              className="relative flex items-center p-4 h-full border border-white/20 rounded-xl bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ backdropFilter: "blur(8px)" }}
            >
              {/* Decorative accent stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor} opacity-80 rounded-l-xl`}
              ></div>

              <div className="flex items-center gap-4 pl-1">
                {/* Icon with floating animation */}
                <div className="relative">
                  <div
                    className={`absolute inset-0 ${accentColor} rounded-full blur-md`}
                    style={animationStyles.pulse}
                  ></div>
                  <div
                    className={`relative flex items-center justify-center p-2 rounded-full ${accentColor} shadow-lg`}
                  >
                    <Sparkles className="w-3 h-3 text-gray-950" />
                  </div>
                </div>

                {/* Benefit text */}
                <div className="flex-1">
                  <span
                    className="text-xs md:text-sm font-medium"
                    style={{
                      backgroundImage:
                        "linear-gradient(to bottom right, #111827, #4B5563)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {benefit}
                  </span>
                </div>

                {/* Arrow that appears on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ChevronRight className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
