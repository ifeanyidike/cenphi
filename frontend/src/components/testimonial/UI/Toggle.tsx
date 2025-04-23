// components/UI/Toggle.tsx

import React from "react";
import { motion } from "framer-motion";

interface ToggleProps {
  options: string[];
  activeOption: string;
  onChange: (option: string) => void;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  options,
  activeOption,
  onChange,
  className = "",
}) => {
  return (
    <div className={`flex bg-slate-50 rounded-lg p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeOption === option
              ? "text-white"
              : "text-slate-700 hover:text-blue-600"
          }`}
          onClick={() => onChange(option)}
        >
          {activeOption === option && (
            <motion.div
              layoutId="toggleBackground"
              className="absolute inset-0 bg-blue-500 rounded-md"
              style={{ zIndex: -1 }}
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          {option}
        </button>
      ))}
    </div>
  );
};

export default Toggle;

// // components/UI/Toggle.tsx

// import React from "react";
// import { motion } from "framer-motion";

// interface ToggleProps {
//   options: Array<{
//     value: string;
//     label: string;
//     icon?: React.ReactNode;
//   }>;
//   activeOption: string;
//   onChange: (option: string) => void;
//   variant?: "default" | "pills" | "tabs" | "underlined" | "minimal";
//   size?: "sm" | "md" | "lg";
//   fullWidth?: boolean;
//   disabled?: boolean;
//   className?: string;
// }

// const Toggle: React.FC<ToggleProps> = ({
//   options,
//   activeOption,
//   onChange,
//   variant = "default",
//   size = "md",
//   fullWidth = false,
//   disabled = false,
//   className = "",
// }) => {
//   // Base container styles
//   const containerBaseStyles = "flex items-center";

//   // Variant-specific container styles
//   const containerVariantStyles = {
//     default: "bg-slate-100 p-1 rounded-lg shadow-inner",
//     pills: "gap-2",
//     tabs: "border-b border-slate-200",
//     underlined: "gap-8",
//     minimal: "gap-4",
//   };

//   // Size-specific styles
//   const containerSizeStyles = {
//     sm: "text-xs",
//     md: "text-sm",
//     lg: "text-base",
//   };

//   // Option base styles by variant
//   const optionBaseStyles = {
//     default: "relative rounded transition-colors duration-200",
//     pills: "relative rounded-full transition-colors duration-200 border-2",
//     tabs: "relative transition-colors duration-200 border-b-2 border-transparent",
//     underlined: "relative transition-colors duration-200 pb-2",
//     minimal: "relative transition-colors duration-200",
//   };

//   // Option size styles
//   const optionSizeStyles = {
//     sm: {
//       default: "px-3 py-1.5",
//       pills: "px-3 py-1",
//       tabs: "px-4 py-2",
//       underlined: "px-2",
//       minimal: "px-3 py-1",
//     },
//     md: {
//       default: "px-4 py-2",
//       pills: "px-4 py-1.5",
//       tabs: "px-6 py-3",
//       underlined: "px-2",
//       minimal: "px-4 py-1.5",
//     },
//     lg: {
//       default: "px-6 py-2.5",
//       pills: "px-6 py-2",
//       tabs: "px-8 py-4",
//       underlined: "px-4",
//       minimal: "px-5 py-2",
//     },
//   };

//   // Option active/inactive styles
//   const optionActiveStyles = {
//     default: "text-white font-medium",
//     pills: "border-blue-500 bg-blue-500 text-white font-medium",
//     tabs: "border-blue-500 text-blue-600 font-medium",
//     underlined: "text-blue-600 font-medium",
//     minimal: "text-blue-600 font-medium",
//   };

//   const optionInactiveStyles = {
//     default: "text-slate-700 hover:text-blue-600",
//     pills:
//       "border-transparent bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200",
//     tabs: "text-slate-600 hover:text-blue-600 hover:border-blue-200",
//     underlined: "text-slate-600 hover:text-blue-600",
//     minimal: "text-slate-600 hover:text-blue-600",
//   };

//   // Width styles
//   const widthStyles = fullWidth ? "w-full" : "";

//   // Disabled styles
//   const disabledStyles = disabled ? "opacity-50 pointer-events-none" : "";

//   // Container final classes
//   const containerClasses = `
//     ${containerBaseStyles}
//     ${containerVariantStyles[variant]}
//     ${containerSizeStyles[size]}
//     ${widthStyles}
//     ${disabledStyles}
//     ${className}
//   `;

//   // Animation based on variant
//   const backgroundAnimation = {
//     default: {
//       rest: { opacity: 0 },
//       hover: { opacity: 0.05 },
//     },
//     pills: {
//       rest: { opacity: 0 },
//       hover: { opacity: 0.1 },
//     },
//     tabs: {
//       rest: { opacity: 0 },
//       hover: { opacity: 0 },
//     },
//     underlined: {
//       rest: { opacity: 0 },
//       hover: { opacity: 0 },
//     },
//     minimal: {
//       rest: { opacity: 0 },
//       hover: { opacity: 0.05 },
//     },
//   };

//   // Define motion elements based on variant
//   const MotionElement =
//     variant === "default" ? (
//       <motion.div
//         layoutId="toggleBackground"
//         className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded"
//         style={{ zIndex: -1 }}
//         initial={false}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//       />
//     ) : variant === "tabs" ? (
//       <motion.div
//         layoutId="toggleBorder"
//         className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
//         initial={false}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//       />
//     ) : variant === "underlined" ? (
//       <motion.div
//         layoutId="toggleUnderline"
//         className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
//         initial={false}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//       />
//     ) : null;

//   return (
//     <div className={containerClasses}>
//       {options.map((option) => {
//         const isActive = activeOption === option.value;

//         // Determine option styles based on variant, size, and active state
//         const optionClasses = `
//           ${optionBaseStyles[variant]}
//           ${optionSizeStyles[size][variant]}
//           ${isActive ? optionActiveStyles[variant] : optionInactiveStyles[variant]}
//           ${fullWidth ? "flex-1 text-center" : ""}
//           cursor-pointer
//         `;

//         return (
//           <motion.button
//             key={option.value}
//             className={optionClasses}
//             onClick={() => onChange(option.value)}
//             whileTap={{ scale: 0.98 }}
//             whileHover="hover"
//             initial="rest"
//           >
//             {isActive && variant !== "pills" && MotionElement}

//             <div className="flex items-center justify-center gap-2">
//               {option.icon && <span>{option.icon}</span>}
//               <span>{option.label || option.value}</span>
//             </div>

//             <motion.div
//               variants={backgroundAnimation[variant]}
//               className="absolute inset-0 bg-current rounded"
//               style={{ zIndex: -1 }}
//             />
//           </motion.button>
//         );
//       })}
//     </div>
//   );
// };

// export default Toggle;
