import React from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

interface ConnectionStatusBannerProps {
  sseError: string | null;
  isConnected: boolean;
  onReconnect: () => void;
  sanitizeErrorMessage: (message: string) => string;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  sseError,
  isConnected,
  onReconnect,
  sanitizeErrorMessage,
}) => {
  if (isConnected && !sseError) return null;

  const isReconnecting = sseError?.includes("Reconnecting") || sseError?.includes("Connecting");

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-3">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div
          className={`rounded-lg border p-3 ${
            isReconnecting
              ? "border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50/50"
              : "border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50/50"
          }`}
        >
          <div className="flex items-start gap-3">
            {isReconnecting ? (
              <Loader2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-[11px] font-semibold ${
                  isReconnecting ? "text-amber-900" : "text-red-900"
                }`}
              >
                {isReconnecting ? "Reconnecting..." : "Connection Issue"}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${
                  isReconnecting ? "text-amber-700" : "text-red-700"
                }`}
              >
                {sseError
                  ? sanitizeErrorMessage(sseError)
                  : "Processing continues in background. Connection will be restored automatically."}
              </p>
            </div>
            {!isReconnecting && (
              <button
                onClick={onReconnect}
                className="h-6 px-2.5 rounded-md border border-red-300/60 bg-white text-red-700 hover:bg-red-50 text-[10px] font-semibold transition-all"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
