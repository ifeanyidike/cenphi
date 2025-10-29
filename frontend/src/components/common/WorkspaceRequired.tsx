import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WorkspaceRequiredProps {
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export const WorkspaceRequired: React.FC<WorkspaceRequiredProps> = ({
  message = "A valid workspace ID is required to access this page.",
  showBackButton = true,
  showHomeButton = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden text-center p-8"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Workspace Required
          </h3>

          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>

          <div className="space-y-3">
            {showBackButton && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(-1)}
                className="w-full flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl transition-colors shadow-lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </motion.button>
            )}

            {showHomeButton && (
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-2xl transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkspaceRequired;