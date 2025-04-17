import React from "react";
import { motion } from "framer-motion";

interface QuickTipsProps {
  isDarkMode: boolean;
}

const QuickTips: React.FC<QuickTipsProps> = ({ isDarkMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className={`mt-3 p-3 rounded-lg border ${
        isDarkMode
          ? "bg-slate-800 border-slate-700 text-slate-300"
          : "bg-blue-50 border-blue-100 text-slate-700"
      }`}
    >
      <div className="flex">
        <div className="mr-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-blue-500"
          >
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Quick Tips</h4>
          <ul className="text-xs space-y-1 list-disc pl-4">
            <li>
              <span className="font-semibold">Select</span>: Choose objects and
              navigate
            </li>
            <li>
              <span className="font-semibold">Zoom</span>: Click on image to
              zoom in
            </li>
            <li>
              <span className="font-semibold">Crop</span>: Click to create a
              crop area, then resize and apply
            </li>
            <li>
              <span className="font-semibold">Text</span>: Click to add text,
              then edit and position it
            </li>
            <li>
              <span className="font-semibold">Draw</span>: Draw directly on the
              image, adjust brush size and color
            </li>
          </ul>
          <p className="text-xs mt-2">
            Hover over any tool for more information.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickTips;
