import React, { useState, useEffect } from "react";
import { ChevronRight, Orbit, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { collectionStore } from "@/stores/collectionStore";
import { useNavigate } from "react-router-dom";

// --- Types ---
type TestimonialNavHover = "change" | "next" | "minimize" | null;
type ViewMode = "expanded" | "minimized";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  color: string;
}

interface ChangeRenderTypeProps {
  type: "audio" | "video" | "text" | null;
  isComplete?: boolean;
  onNext?: () => void;
  className?: string;
}

// --- Hooks ---
const useParticleEffect = (isActive: boolean) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const colors = ["#FFD700", "#FFF4BD", "#FFE668"];
    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticles = [...prev];
        if (newParticles.length > 12) newParticles.shift();

        newParticles.push({
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 2 + Math.random() * 3,
          opacity: 0.4 + Math.random() * 0.3,
          duration: 1 + Math.random(),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
        return newParticles;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isActive]);

  return particles;
};

// --- Premium Button Component ---
interface PremiumButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  onHoverChange: (isHovered: boolean) => void;
  isHovered: boolean;
  className?: string;
  particles: Particle[];
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  label,
  icon,
  onClick,
  onHoverChange,
  isHovered,
  className,
  particles,
}) => {
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={cn(
        "group relative px-8 py-4 flex items-center gap-3",
        "transition-all duration-500 ease-out-expo",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        "overflow-hidden rounded-lg",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Base layer with gradient */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-all duration-500",
          "bg-gradient-to-r from-black/40 via-black/60 to-black/40",
          "backdrop-blur-sm"
        )}
      />

      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          background: isHovered
            ? "linear-gradient(to right, rgba(255,215,0,0.3), rgba(255,215,0,0.1), rgba(255,215,0,0.3))"
            : "none",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 1, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Content wrapper */}
      <motion.div
        className="relative flex items-center gap-3 z-10"
        animate={{
          y: isHovered ? [-1, 1] : 0,
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        {/* Icon animation */}
        <motion.div
          animate={{
            rotate: isHovered ? 360 : 0,
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={cn(
            "transition-colors duration-300",
            isHovered ? "text-yellow-300" : "text-yellow-400/90"
          )}
        >
          {icon}
        </motion.div>

        {/* Text with gradient effect */}
        <motion.span
          className={cn(
            "font-light tracking-wide text-sm transition-all duration-300",
            isHovered ? "text-white" : "text-white/80"
          )}
        >
          {label}
        </motion.span>
      </motion.div>

      {/* Particle effects */}
      <AnimatePresence mode="sync">
        {isHovered &&
          particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full pointer-events-none mix-blend-screen"
              initial={{
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{
                opacity: particle.opacity,
                scale: 1,
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
              }}
              exit={{
                opacity: 0,
                scale: 0,
              }}
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              transition={{ duration: particle.duration }}
            />
          ))}
      </AnimatePresence>
    </motion.button>
  );
};

// --- Main Component ---
const ChangeRenderType: React.FC<ChangeRenderTypeProps> = observer(
  ({ type, isComplete, onNext, className }) => {
    const [viewMode, setViewMode] = useState<ViewMode>("expanded");
    const navigate = useNavigate();
    const [hoveredButton, setHoveredButton] =
      useState<TestimonialNavHover>(null);
    const particles = useParticleEffect(!!hoveredButton);
    const onChangeType = () => {
      runInAction(() => {
        collectionStore.changeType();
      });
      navigate(`/collection`);
    };

    const handleHoverChange = (
      button: TestimonialNavHover,
      isHovered: boolean
    ) => {
      setHoveredButton(isHovered ? button : null);
    };

    return (
      <motion.div
        className={cn(
          "fixed z-50",
          viewMode === "expanded"
            ? "bottom-0 left-0 right-0"
            : "bottom-6 right-6",
          className
        )}
        initial={false}
        animate={viewMode}
      >
        <AnimatePresence mode="wait">
          {viewMode === "expanded" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative"
            >
              {/* Premium glass backdrop */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black/95 backdrop-blur-md" />

              {/* Subtle animated gradient line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />

              <div className="relative px-6 py-5">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Title Section */}
                    <div className="relative">
                      <h3 className="font-serif text-xl italic text-white/90 tracking-wide">
                        Elevate your{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 animate-shimmer">
                          voice
                        </span>
                      </h3>
                      <p className="text-sm text-white/60 mt-1 font-light tracking-wide">
                        Share experiences that inspire change
                      </p>

                      {/* Elegant separator */}
                      <div className="absolute -bottom-3 left-0 h-px w-3/4 bg-gradient-to-r from-white/20 to-transparent" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                      <PremiumButton
                        label="Change Type"
                        icon={<Orbit className="w-5 h-5" />}
                        onClick={onChangeType}
                        onHoverChange={(isHovered) =>
                          handleHoverChange("change", isHovered)
                        }
                        isHovered={hoveredButton === "change"}
                        particles={particles}
                        className="hidden md:flex"
                      />

                      {type !== "text" && onNext && (
                        <PremiumButton
                          label="Next Question"
                          icon={<ChevronRight className="w-5 h-5" />}
                          onClick={() => {
                            if (isComplete) {
                              collectionStore.handleComplete();
                              navigate(`/collection/thank-you`);
                            }
                            onNext();
                          }}
                          onHoverChange={(isHovered) =>
                            handleHoverChange("next", isHovered)
                          }
                          isHovered={hoveredButton === "next"}
                          particles={particles}
                          className="hidden md:flex"
                        />
                      )}

                      {/* Mobile actions */}
                      <div className="flex md:hidden gap-3">
                        <motion.button
                          onClick={onChangeType}
                          className="p-3 rounded-lg bg-black/40 text-yellow-400/90"
                          whileTap={{ scale: 0.95 }}
                        >
                          <Orbit className="w-5 h-5" />
                        </motion.button>

                        {type !== "text" && (
                          <motion.button
                            onClick={() => {
                              if (isComplete) {
                                collectionStore.handleComplete();
                              }
                              if (onNext) onNext();
                            }}
                            className="p-3 rounded-lg bg-black/40 text-yellow-400/90"
                            whileTap={{ scale: 0.95 }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>

                      {/* Minimize button */}
                      <motion.button
                        onClick={() =>
                          setViewMode(
                            viewMode === "expanded" ? "minimized" : "expanded"
                          )
                        }
                        className={cn(
                          "p-2 rounded-lg transition-colors duration-300",
                          "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Minimize2 className="w-5 h-5 text-white/60" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setViewMode("expanded")}
              className={cn(
                "p-4 rounded-full",
                "bg-gradient-to-r from-black/80 to-black/90",
                "backdrop-blur-md shadow-lg",
                "border border-white/10",
                "hover:border-white/20 transition-colors"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Maximize2 className="w-6 h-6 text-white/80" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

export default ChangeRenderType;

// --- Inject premium animation styles ---
const style = document.createElement("style");
style.textContent = `
  @keyframes shimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .animate-shimmer {
    background-size: 200% auto;
    animation: shimmer 8s linear infinite;
  }
  .ease-out-expo {
    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  }
`;
document.head.appendChild(style);
