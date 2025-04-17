import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingSelectorProps {
  rating: number;
  onChange: (value: number | ((prevState: number) => number)) => void;
  primaryColor: string;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

const RatingSelector: React.FC<RatingSelectorProps> = ({
  rating,
  onChange,
  primaryColor = "#4F46E5",
  max = 5,
  size = "md",
  showLabel = true,
  disabled = false,
  required = false,
  name = "rating",
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [hasFocus, setHasFocus] = useState(false);

  // Calculate the active rating (either from hover state or actual rating)
  const activeRating = hoverRating !== null ? hoverRating : rating;

  // Get size dimensions
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return { starSize: "h-5 w-5", gap: "gap-1", textSize: "text-xs" };
      case "lg":
        return { starSize: "h-9 w-9", gap: "gap-3", textSize: "text-lg" };
      default:
        return { starSize: "h-7 w-7", gap: "gap-2", textSize: "text-sm" };
    }
  };

  const { starSize, gap, textSize } = getSizeClass();

  // Get label text based on rating
  const getLabelText = () => {
    if (!activeRating) return "Select a rating";

    const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

    return labels[Math.min(activeRating, 5) - 1];
  };

  // Star animation variants
  const starVariants = {
    active: (custom: { index: number; activeRating: number }) => ({
      scale: custom.index <= custom.activeRating ? 1.1 : 1,
      rotate: custom.index <= custom.activeRating ? [0, 15, 0] : 0,
      transition: {
        type: "spring",
        duration: 0.3,
        delay: custom.index * 0.05,
      },
    }),
    inactive: {
      scale: 1,
      rotate: 0,
    },
    hover: {
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10,
      },
    },
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        disabled && "opacity-70 cursor-not-allowed"
      )}
    >
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={rating}
        required={required}
        aria-hidden="true"
      />

      {/* Rating stars */}
      <div
        className={cn(
          "flex items-center justify-center",
          gap,
          hasFocus &&
            "ring-2 ring-offset-2 ring-blue-300 rounded-full px-2 py-1",
          disabled && "pointer-events-none"
        )}
        onMouseLeave={() => !disabled && setHoverRating(null)}
        onBlur={() => setHasFocus(false)}
        onFocus={() => setHasFocus(true)}
        tabIndex={disabled ? -1 : 0}
        role="radiogroup"
        aria-label="Rating"
      >
        {[...Array(max)].map((_, index) => {
          const starValue = index + 1;
          return (
            <motion.button
              key={starValue}
              type="button"
              custom={{ index: starValue, activeRating }}
              variants={starVariants}
              animate={hasFocus || activeRating > 0 ? "active" : "inactive"}
              whileHover="hover"
              whileTap={{ scale: 0.9 }}
              className={cn(
                "focus:outline-none transition-colors",
                !disabled && "hover:scale-110 focus:scale-110"
              )}
              onClick={() => !disabled && onChange(starValue)}
              onMouseEnter={() => !disabled && setHoverRating(starValue)}
              // onFocus={() => {
              //   !disabled && setHoverRating(starValue);
              //   setHasFocus(true);
              // }}
              aria-checked={rating === starValue}
              role="radio"
              aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
              tabIndex={disabled ? -1 : 0}
            >
              <Star
                className={cn(
                  starSize,
                  starValue <= activeRating
                    ? "fill-current drop-shadow-md"
                    : "fill-none",
                  starValue <= activeRating && hasFocus ? "drop-shadow-lg" : ""
                )}
                style={{
                  color: starValue <= activeRating ? primaryColor : "#CBD5E1",
                  filter:
                    starValue <= activeRating
                      ? "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))"
                      : "none",
                }}
                strokeWidth={1.5}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Rating label */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: activeRating > 0 ? 1 : 0,
            y: activeRating > 0 ? 0 : 5,
          }}
          className={cn(
            "mt-2 font-medium",
            textSize,
            activeRating > 0 ? "text-slate-800" : "text-slate-400"
          )}
          style={{
            color: activeRating > 0 ? primaryColor : "",
          }}
        >
          {getLabelText()}
        </motion.div>
      )}
    </div>
  );
};

export default RatingSelector;
