import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { connectionStatusService } from "@/services/connectionStatusService";

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  
  const platform = searchParams.get("platform");

  useEffect(() => {
    // Update connection status when OAuth is successful
    if (platform === 'google_drive') {
      // Clear any existing cache first
      connectionStatusService.clearCache('google_drive');
      connectionStatusService.clearCache('google');
      
      // Update with new connection status
      connectionStatusService.updateConnectionStatus('google_drive', {
        isConnected: true,
        provider: 'google_drive',
        accountEmail: 'Connected',
        lastSync: new Date(),
      });
      
      // Also update the cache immediately
      connectionStatusService.updateConnectionStatus('google', {
        isConnected: true,
        provider: 'google',
        accountEmail: 'Connected',
        lastSync: new Date(),
      });
    } else if (platform === 'linkedin') {
      console.log('OAuthSuccess: Updating LinkedIn connection status');
      // Clear any existing cache first
      connectionStatusService.clearCache('linkedin');
      
      // Update with new connection status
      connectionStatusService.updateConnectionStatus('linkedin', {
        isConnected: true,
        provider: 'linkedin',
        accountEmail: 'Connected',
        lastSync: new Date(),
      });
      console.log('OAuthSuccess: LinkedIn connection status updated');
    }

    // Start countdown for automatic redirect (3 seconds)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect based on the platform
          if (platform === 'google_drive') {
            window.location.href = "/google-drive";
          } else if (platform === 'linkedin') {
            window.location.href = "/settings";
          } else {
            window.location.href = "/settings";
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, platform]);

  const getPlatformName = (platform: string | null) => {
    switch (platform) {
      case "google_drive":
        return "Google Drive";
      case "linkedin":
        return "LinkedIn";
      default:
        return platform || "service";
    }
  };

  const handleContinue = () => {
    if (platform === 'google_drive') {
      window.location.href = "/google-drive";
    } else if (platform === 'linkedin') {
      window.location.href = "/settings";
    } else {
      window.location.href = "/settings";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
      >
        <div className="text-center">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-50"></div>
            <CheckCircle className="h-16 w-16 text-green-500 relative z-10 mx-auto" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Connection Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your {getPlatformName(platform)} account has been successfully connected.
          </p>

          {/* Redirect Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-center">
              Redirecting to {platform === 'google_drive' ? 'Google Drive' : 'settings'} in{" "}
              <span className="font-bold">{countdown}</span> seconds...
            </p>
          </div>

                     {/* Action Button */}
           <div className="flex justify-center">
             <button
               onClick={handleContinue}
               className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
             >
               Continue to {platform === 'google_drive' ? 'Google Drive' : 'Settings'}
               <ArrowRight className="w-4 h-4 ml-2" />
             </button>
           </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 mt-4">
            You can now use {getPlatformName(platform)} features in your workspace.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthSuccess;
